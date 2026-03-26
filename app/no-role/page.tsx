"use client";

import { useUser, SignOutButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NoRolePage() {
  const { user } = useUser();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <CardTitle>Welcome, {user?.firstName ?? "User"}!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Your account has been created but no role has been assigned yet.
            Please contact your administrator to assign you a role
            (Admin, Branch Manager, or Branch Staff).
          </p>
          <p className="text-sm text-muted-foreground">
            Email: {user?.primaryEmailAddress?.emailAddress}
          </p>
          <div className="flex justify-center gap-3 pt-4">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Check Again
            </Button>
            <SignOutButton>
              <Button variant="destructive">Sign Out</Button>
            </SignOutButton>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
