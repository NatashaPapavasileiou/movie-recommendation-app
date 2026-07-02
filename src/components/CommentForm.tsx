import React, { useState } from "react";
import { X, Star } from "lucide-react";
import styles from "./CommentForm.module.css";

interface CommentFormProps {
  movieId: string | undefined;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (text: string, rating: number, movieId: string) => void;
}

export const CommentForm: React.FC<CommentFormProps> = ({
  movieId,
  isOpen,
  onClose,
  onSubmit
}) => {
  const [text, setText] = useState("");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      alert("Please select a rating (1-10 stars).");
      return;
    }
    if (!movieId) {
      alert("Error: Movie ID not found.");
      return;
    }

    onSubmit(text, rating, movieId);
    
    setText("");
    setRating(0);
    onClose();
  };

  return (
    <div className={styles.formOverlay}>
      
      <form onSubmit={handleSubmit} className={styles.formModal}>
        
        <div className={styles.modalHeader}>
          <h2>Write Review</h2>
          <button
            type="button"
            onClick={onClose}
            className={styles.closeButton}
          >
            <X size={20} />
          </button>
        </div>

        <div className={styles.ratingSystem}>
          <div className={styles.starsContainer}>
            {[...Array(10)].map((_, i) => {
              const starValue = i + 1;
              const isStarActive = (hover || rating) >= starValue;
              
              return (
                <button
                  key={i}
                  type="button"
                  onMouseEnter={() => setHover(starValue)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(starValue)}
                  className={styles.starButton}
                >
                  <Star
                    size={24}
                    className={`${styles.starIcon} ${isStarActive ? styles.starActive : styles.starInactive}`}
                  />
                </button>
              );
            })}
          </div>
          <p className={styles.ratingCounter}>
            {rating || hover || 0} <span>/ 10</span>
          </p>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share your thoughts about the movie..."
          className={styles.reviewTextArea}
        />

  
        <button
          type="submit"
          className={styles.submitButton}
        >
          SUBMIT REVIEW
        </button>
      </form>
    </div>
  );
};