import { useState } from "react";
import { useGetMe, useUpdateMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Edit2, Check, X, MapPin, Clock, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.coerce.number().int().min(13).max(120),
  bio: z.string().max(300),
  gym: z.string().min(1, "Gym name is required"),
  schedule: z.string(),
  interestsRaw: z.string(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function Profile() {
  const { data: me, isLoading } = useGetMe();
  const [isEditing, setIsEditing] = useState(false);
  const updateMe = useUpdateMe();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: me?.name ?? "",
      age: me?.age ?? 25,
      bio: me?.bio ?? "",
      gym: me?.gym ?? "",
      schedule: me?.schedule ?? "",
      interestsRaw: me?.interests?.join(", ") ?? "",
    },
  });

  const handleEdit = () => {
    form.reset({
      name: me?.name ?? "",
      age: me?.age ?? 25,
      bio: me?.bio ?? "",
      gym: me?.gym ?? "",
      schedule: me?.schedule ?? "",
      interestsRaw: me?.interests?.join(", ") ?? "",
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    form.reset();
  };

  const onSubmit = (data: ProfileForm) => {
    const interests = data.interestsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    updateMe.mutate(
      { data: { name: data.name, age: data.age, bio: data.bio, gym: data.gym, schedule: data.schedule, interests } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          setIsEditing(false);
          toast({ title: "Profile updated!", description: "Your changes have been saved." });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-xl">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    );
  }

  if (!me) return null;

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">My Profile</h1>
          <p className="text-muted-foreground mt-1">How others see you</p>
        </div>
        {!isEditing && (
          <Button onClick={handleEdit} variant="outline" size="sm" className="gap-2" data-testid="btn-edit-profile">
            <Edit2 className="w-4 h-4" />
            Edit
          </Button>
        )}
      </div>

      {!isEditing ? (
        <div className="space-y-4">
          <div className="bg-card border border-border/50 rounded-3xl p-8 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-muted to-muted/30 flex items-center justify-center text-4xl mx-auto mb-4">
              {me.avatar}
            </div>
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-2xl font-black">{me.name}</h2>
              {me.verified && <span className="text-[#3B82F6] font-bold">✓</span>}
            </div>
            <p className="text-muted-foreground mt-1">{me.age} years old</p>
            <div className="flex flex-col gap-2 mt-4 text-sm text-muted-foreground">
              <div className="flex items-center justify-center gap-1.5">
                <Building className="w-3.5 h-3.5" />
                <span>{me.gym}</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{me.schedule}</span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border/50 rounded-2xl p-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Bio</h3>
            <p className="text-foreground leading-relaxed">{me.bio || <span className="text-muted-foreground italic">No bio yet</span>}</p>
          </div>

          <div className="bg-card border border-border/50 rounded-2xl p-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {me.interests.map((interest) => (
                <Badge key={interest} variant="outline" className="bg-muted/50 border-border text-foreground">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Name</FormLabel>
                      <FormControl>
                        <Input {...field} className="bg-muted/50 border-border/50" data-testid="input-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Age</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" className="bg-muted/50 border-border/50" data-testid="input-age" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Bio</FormLabel>
                    <FormControl>
                      <Textarea {...field} className="bg-muted/50 border-border/50 resize-none" rows={3} data-testid="input-bio" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gym"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Gym</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-muted/50 border-border/50" data-testid="input-gym" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="schedule"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Schedule</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Mon-Fri 6PM" className="bg-muted/50 border-border/50" data-testid="input-schedule" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="interestsRaw"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Interests (comma separated)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Powerlifting, Running, Yoga" className="bg-muted/50 border-border/50" data-testid="input-interests" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={updateMe.isPending} className="flex-1 gap-2 font-bold" data-testid="btn-save-profile">
                <Check className="w-4 h-4" />
                {updateMe.isPending ? "Saving..." : "Save Changes"}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel} className="gap-2" data-testid="btn-cancel-edit">
                <X className="w-4 h-4" />
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
