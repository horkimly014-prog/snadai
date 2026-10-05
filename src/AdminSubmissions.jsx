import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Check, X } from "lucide-react";
import { supabase } from "./supabaseClient";
import { useAuth } from "./useAuth";

const STATUS_STYLES = {
  pending: { background: "#f4ead9", color: "#8a5a00" },
  approved: { background: "#dff0e4", color: "#1d6b3a" },
  rejected: { background: "#f6dede", color: "#a32e2e" },
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f7f6f4",
    fontFamily: "'Times New Roman', Georgia, serif",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "24px 40px",
    background: "#1a1c1c",
    color: "#ffffff",
  },
  heading: {
    margin: 0,
    fontWeight: 400,
    fontSize: "28px",
  },
  logoutButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "transparent",
    border: "1px solid #ffffff",
    color: "#ffffff",
    cursor: "pointer",
    padding: "10px 18px",
    fontFamily: "'Times New Roman', Georgia, serif",
    fontSize: "14px",
    letterSpacing: "1px",
    textTransform: "uppercase",
  },
  content: {
    padding: "32px 40px 80px",
    maxWidth: "1100px",
    margin: "0 auto",
  },
  empty: {
    textAlign: "center",
    color: "#6b7280",
    marginTop: "80px",
    fontSize: "18px",
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e5e3df",
    padding: "24px",
    marginBottom: "20px",
  },
  cardTop: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "16px",
  },
  artworkTitle: {
    margin: "0 0 4px",
    fontSize: "22px",
    fontWeight: 400,
    color: "#1a1c1c",
  },
  artistLine: {
    margin: 0,
    fontSize: "14px",
    color: "#6b7280",
  },
  statusBadge: {
    padding: "6px 14px",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "1px",
    textTransform: "uppercase",
  },
  meta: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "12px",
    marginBottom: "16px",
    fontSize: "14px",
    color: "#444748",
  },
  metaLabel: {
    display: "block",
    fontSize: "11px",
    letterSpacing: "1px",
    textTransform: "uppercase",
    color: "#9ca3af",
    marginBottom: "2px",
  },
  statement: {
    fontSize: "15px",
    lineHeight: "1.6",
    color: "#1a1c1c",
    marginBottom: "16px",
    whiteSpace: "pre-wrap",
  },
  images: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginBottom: "16px",
  },
  image: {
    width: "120px",
    height: "120px",
    objectFit: "cover",
    border: "1px solid #e5e3df",
  },
  actions: {
    display: "flex",
    gap: "10px",
  },
  approveButton: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "#1d6b3a",
    color: "#ffffff",
    border: "none",
    cursor: "pointer",
    padding: "10px 18px",
    fontFamily: "'Times New Roman', Georgia, serif",
    fontSize: "14px",
    letterSpacing: "1px",
    textTransform: "uppercase",
  },
  rejectButton: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "#a32e2e",
    color: "#ffffff",
    border: "none",
    cursor: "pointer",
    padding: "10px 18px",
    fontFamily: "'Times New Roman', Georgia, serif",
    fontSize: "14px",
    letterSpacing: "1px",
    textTransform: "uppercase",
  },
  disabledButton: {
    opacity: 0.5,
    cursor: "default",
  },
};

export default function AdminSubmissions() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [submissions, setSubmissions] = useState([]);
  const [imageUrls, setImageUrls] = useState({});
  const [loadingList, setLoadingList] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const loadSubmissions = useCallback(async () => {
    setLoadingList(true);
    const { data, error } = await supabase
      .from("submissions")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setSubmissions(data ?? []);
    setLoadingList(false);
  }, []);

  // Gate the page: must be logged in and present in admin_users, otherwise
  // bounce to the admin login screen.
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/admin/login");
      return;
    }

    let cancelled = false;
    supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        if (!data) {
          navigate("/admin/login");
          return;
        }
        setCheckingAdmin(false);
        loadSubmissions();
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, navigate, loadSubmissions]);

  // Submission images live in a private bucket, so each file needs its own
  // short-lived signed URL rather than a plain public path.
  useEffect(() => {
    if (!submissions.length) return;

    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        submissions.map(async (submission) => {
          const paths = (submission.file_path || "")
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean);

          const urls = await Promise.all(
            paths.map(async (path) => {
              const { data } = await supabase.storage
                .from("submissions")
                .createSignedUrl(path, 60 * 60);
              return data?.signedUrl ?? null;
            })
          );

          return [submission.id, urls.filter(Boolean)];
        })
      );

      if (!cancelled) setImageUrls(Object.fromEntries(entries));
    })();

    return () => {
      cancelled = true;
    };
  }, [submissions]);

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    const { error } = await supabase
      .from("submissions")
      .update({ status })
      .eq("id", id);

    if (!error) {
      setSubmissions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status } : s))
      );
      supabase.functions
        .invoke("send-submission-decision-email", {
          body: { submissionId: id, status },
        })
        .catch((err) => console.error("Failed to send decision email:", err));
    }
    setUpdatingId(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  if (authLoading || checkingAdmin) return null;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.heading}>Submission Review</h1>
        <button style={styles.logoutButton} onClick={handleLogout}>
          <LogOut size={16} strokeWidth={1.5} />
          Log out
        </button>
      </div>

      <div style={styles.content}>
        {loadingList ? (
          <p style={styles.empty}>Loading submissions...</p>
        ) : submissions.length === 0 ? (
          <p style={styles.empty}>No submissions yet.</p>
        ) : (
          submissions.map((submission) => {
            const badge =
              STATUS_STYLES[submission.status] || STATUS_STYLES.pending;
            const isUpdating = updatingId === submission.id;

            return (
              <div key={submission.id} style={styles.card}>
                <div style={styles.cardTop}>
                  <div>
                    <h2 style={styles.artworkTitle}>
                      {submission.artwork_title || "Untitled"}
                    </h2>
                    <p style={styles.artistLine}>
                      {submission.full_name} &middot; {submission.email}
                    </p>
                  </div>
                  <span
                    style={{ ...styles.statusBadge, ...badge }}
                  >
                    {submission.status || "pending"}
                  </span>
                </div>

                <div style={styles.meta}>
                  <div>
                    <span style={styles.metaLabel}>Medium</span>
                    {submission.medium || "—"}
                  </div>
                  <div>
                    <span style={styles.metaLabel}>Dimensions</span>
                    {submission.dimensions || "—"}
                  </div>
                  <div>
                    <span style={styles.metaLabel}>Year</span>
                    {submission.year || "—"}
                  </div>
                  <div>
                    <span style={styles.metaLabel}>Submitted</span>
                    {submission.created_at
                      ? new Date(submission.created_at).toLocaleDateString()
                      : "—"}
                  </div>
                </div>

                {submission.statement && (
                  <p style={styles.statement}>{submission.statement}</p>
                )}

                {(imageUrls[submission.id] || []).length > 0 && (
                  <div style={styles.images}>
                    {imageUrls[submission.id].map((url, i) => (
                      <img key={i} src={url} alt="" style={styles.image} />
                    ))}
                  </div>
                )}

                <div style={styles.actions}>
                  <button
                    style={{
                      ...styles.approveButton,
                      ...(isUpdating || submission.status === "approved"
                        ? styles.disabledButton
                        : {}),
                    }}
                    disabled={isUpdating || submission.status === "approved"}
                    onClick={() => updateStatus(submission.id, "approved")}
                  >
                    <Check size={16} strokeWidth={1.5} />
                    Approve
                  </button>
                  <button
                    style={{
                      ...styles.rejectButton,
                      ...(isUpdating || submission.status === "rejected"
                        ? styles.disabledButton
                        : {}),
                    }}
                    disabled={isUpdating || submission.status === "rejected"}
                    onClick={() => updateStatus(submission.id, "rejected")}
                  >
                    <X size={16} strokeWidth={1.5} />
                    Reject
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
