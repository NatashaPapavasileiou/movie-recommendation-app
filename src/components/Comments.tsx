import React, { useEffect, useState } from "react";
import { Star, Trash2 } from "lucide-react"; 
import styles from "./Comments.module.css";
import { getFormattedDate } from "../modules/types_files";
import { supabase } from "../modules/supabaseClient"; 

interface CommentData {
  id: string;
  user_id: string; 
  user_email: string;
  content: string;
  rating: number;
  created_at: string;
}

interface CommentsProps {
  comments: CommentData[];
  onCommentDeleted: () => void;
}

export const Comments: React.FC<CommentsProps> = ({ comments, onCommentDeleted }) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUserId(session.user.id);
      }
    };
    fetchUser();
  }, []);

  
  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;

    try {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;

      alert("Review deleted successfully!");
      onCommentDeleted(); 
    } catch (error: any) {
      console.error("Error deleting comment:", error.message);
      alert("Could not delete review: " + error.message);
    }
  };

  return (
    <div className={styles.commentsSection}>
      <div className={styles.sectionHeader}>
        <h3>Community Reviews</h3>
      </div>

      <div className={styles.commentsContainer}>
        {comments.length === 0 ? (
          <p className={styles.noComments}>No reviews yet. Be the first to write one!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className={styles.commentCard}>
              <div className={styles.cardHeader}>
                <div className={styles.userInfo}>
                  <div className={styles.avatarCircle}>
                    {comment.user_email?.[0]?.toUpperCase() || "✕"}
                  </div>
                  <div>
                    <span className={styles.userEmail}>{comment.user_email?.split("@")[0]}</span>
                    <div className={styles.starsRow}>
                      {[...Array(10)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={
                            i < comment.rating
                              ? "fill-yellow-500 text-yellow-500"
                              : "text-zinc-700"
                          }
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className={styles.headerRightGroup}>
                  <span className={styles.commentDate}>
                    {getFormattedDate(comment.created_at)}
                  </span>
                  
                  
                  {currentUserId === comment.user_id && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className={styles.deleteButton}
                      title="Delete review"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              <p className={styles.commentContent}>{comment.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};