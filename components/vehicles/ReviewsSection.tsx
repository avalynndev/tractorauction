"use client";

import { useState, useEffect } from "react";
import { Star, User, CheckCircle, ThumbsUp } from "lucide-react";
import toast from "react-hot-toast";

interface Review {
  id: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
  isVerified: boolean;
  helpfulCount: number;
  createdAt: string;
  reviewer: {
    id: string;
    fullName: string;
    profilePhoto?: string | null;
  };
}

interface ReviewsSectionProps {
  vehicleId: string;
  isAuthenticated: boolean;
}

export default function ReviewsSection({ vehicleId, isAuthenticated }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [ratingDistribution, setRatingDistribution] = useState({
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [vehicleId]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reviews?vehicleId=${vehicleId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
        setAverageRating(data.averageRating || 0);
        setTotalReviews(data.totalReviews || 0);
        setRatingDistribution(data.ratingDistribution || {
          5: 0, 4: 0, 3: 0, 2: 0, 1: 0,
        });
      } else {
        // Handle non-OK responses
        const errorData = await response.json().catch(() => ({ message: "Failed to fetch reviews" }));
        console.error("Error fetching reviews:", errorData.message || response.statusText);
        
        // Set empty state on error
        setReviews([]);
        setAverageRating(0);
        setTotalReviews(0);
        setRatingDistribution({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
      }
    } catch (error: any) {
      console.error("Error fetching reviews:", error);
      
      // Handle network errors
      if (error?.message?.includes("Failed to fetch") || error?.name === "TypeError") {
        console.error("Network error - server may be down or IP blocked");
      }
      
      // Set empty state on error
      setReviews([]);
      setAverageRating(0);
      setTotalReviews(0);
      setRatingDistribution({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error("Please login to submit a review");
      return;
    }

    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vehicleId,
          rating,
          title: title.trim() || undefined,
          comment: comment.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Review submitted successfully");
        setShowReviewForm(false);
        setRating(0);
        setTitle("");
        setComment("");
        fetchReviews();
      } else {
        toast.error(data.message || "Failed to submit review");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (ratingValue: number, interactive = false, size = "w-5 h-5") => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${
              star <= (interactive ? (hoverRating || rating) : ratingValue)
                ? "text-yellow-400 fill-current"
                : "text-gray-300"
            } ${interactive ? "cursor-pointer" : ""}`}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            onClick={() => interactive && setRating(star)}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Reviews & Ratings</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {renderStars(averageRating)}
              <span className="text-xl font-semibold">{averageRating.toFixed(1)}</span>
            </div>
            <span className="text-gray-600">({totalReviews} {totalReviews === 1 ? "review" : "reviews"})</span>
          </div>
        </div>
        {isAuthenticated && !showReviewForm && (
          <button
            onClick={() => setShowReviewForm(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Rating Distribution */}
      {totalReviews > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-3">Rating Distribution</h3>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingDistribution[star as keyof typeof ratingDistribution];
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-20">
                    <span className="text-sm">{star}</span>
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Review Form */}
      {showReviewForm && (
        <form onSubmit={handleSubmitReview} className="mb-6 p-4 border border-gray-200 rounded-lg">
          <h3 className="font-semibold mb-4">Write a Review</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating *
            </label>
            {renderStars(rating, true)}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of your experience"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              maxLength={100}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review (optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this vehicle..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              maxLength={1000}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={submitting || rating === 0}
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowReviewForm(false);
                setRating(0);
                setTitle("");
                setComment("");
              }}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No reviews yet. Be the first to review this vehicle!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  {review.reviewer.profilePhoto ? (
                    <img
                      src={review.reviewer.profilePhoto}
                      alt={review.reviewer.fullName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary-600" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{review.reviewer.fullName}</span>
                      {review.isVerified && (
                        <CheckCircle className="w-4 h-4 text-green-500" title="Verified Purchase" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {renderStars(review.rating, false, "w-4 h-4")}
                      <span className="text-xs text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {review.title && (
                <h4 className="font-semibold mb-2">{review.title}</h4>
              )}
              {review.comment && (
                <p className="text-gray-700 mb-2">{review.comment}</p>
              )}
              {review.helpfulCount > 0 && (
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <ThumbsUp className="w-4 h-4" />
                  <span>{review.helpfulCount} helpful</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}















