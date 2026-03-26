"use client";

import { use, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, Star } from "lucide-react";

export default function FeedbackFormPage({ params }: { params: Promise<{ branchId: string }> }) {
  const { branchId } = use(params);
  const products = useQuery(api.queries.publicProductList.publicProductList, {});
  const submit = useMutation(api.mutations.submitFeedback.submitFeedback);

  const [productId, setProductId] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = products?.filter(
    (p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.styleCode.toLowerCase().includes(searchTerm.toLowerCase())
  ) ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || rating === 0) return;
    setIsSubmitting(true);
    try {
      await submit({
        productId: productId as Id<"products">,
        branchId: branchId as Id<"branches">,
        rating,
        comment,
        contactInfo: contactInfo || undefined,
        source: "qr-code",
      });
      setSubmitted(true);
    } catch {
      // Silently handle — public form
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-lg text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
            <h2 className="text-2xl font-bold">Thank you!</h2>
            <p className="text-muted-foreground">Your feedback has been submitted. We appreciate you taking the time to help us improve.</p>
            <Button variant="outline" onClick={() => { setSubmitted(false); setProductId(""); setRating(0); setComment(""); setContactInfo(""); }}>
              Submit Another
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-center">Product Feedback</CardTitle>
          <p className="text-center text-sm text-muted-foreground">Help us improve by sharing your experience</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label>Search Product</Label>
              <Input
                placeholder="Search by name or style code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && filteredProducts.length > 0 && !productId && (
                <div className="mt-1 max-h-32 overflow-auto rounded border bg-white text-sm">
                  {filteredProducts.slice(0, 10).map((p) => (
                    <button
                      key={p._id}
                      type="button"
                      className="w-full px-3 py-2 text-left hover:bg-gray-100"
                      onClick={() => { setProductId(p._id); setSearchTerm(p.name); }}
                    >
                      {p.name} <span className="text-xs text-muted-foreground">({p.styleCode})</span>
                    </button>
                  ))}
                </div>
              )}
              {productId && (
                <p className="mt-1 text-xs text-green-600">Product selected</p>
              )}
            </div>

            <div>
              <Label>Rating</Label>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1"
                  >
                    <Star
                      className={`h-8 w-8 ${star <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Your Feedback</Label>
              <Textarea
                placeholder="Tell us about your experience with this product..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                required
              />
            </div>

            <div>
              <Label>Contact Info (optional)</Label>
              <Input
                placeholder="Email or phone (optional)"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting || !productId || rating === 0}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Feedback
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
