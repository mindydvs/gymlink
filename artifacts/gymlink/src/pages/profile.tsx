import { useState } from "react";
import { useGetMe, useUpdateMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Edit2, Check, X, Building, Clock, ShieldCheck, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { InterestPicker } from "@/components/interest-picker";
import { GymPicker } from "@/components/gym-picker";
import { useAuth } from "@/context/auth";

const profileSchema = z.object({
  name: z.string().min(1, "Name required"),
  age: z.coerce.number().int().min(13).max(120),
  bio: z.string().max(300),
  gymId: z.string().default(""),
  gymName: z.string().default(""),
  schedule: z.string(),
  interests: z.array(z.string()),
});
type ProfileForm = z.infer<typeof profileSchema>;

export default function Profile() {
  const { data: me, isLoading } = useGetMe();
  const [editing, setEditing] = useState(false);
  const updateMe = useUpdateMe();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { logout } = useAuth();

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: me?.name ?? "",
      age: me?.age ?? 25,
      bio: me?.bio ?? "",
      gymId: me?.gymId ?? "",
      gymName: me?.gym ?? "",
      schedule: me?.schedule ?? "",
      interests: me?.interests ?? [],
    },
  });

  const handleEdit = () => {
    form.reset({
      name: me?.name ?? "", age: me?.age ?? 25, bio: me?.bio ?? "",
      gymId: me?.gymId ?? "", gymName: me?.gym ?? "",
      schedule: me?.schedule ?? "", interests: me?.interests ?? [],
    });
    setEditing(true);
  };

  const onSubmit = (data: ProfileForm) => {
    updateMe.mutate(
      { data: { name: data.name, age: data.age, bio: data.bio, gym: data.gymName, gymId: data.gymId || undefined, schedule: data.schedule, interests: data.interests } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          setEditing(false);
          toast({ title: "Profile updated!" });
        },
        onError: () => toast({ title: "Error", description: "Couldn't save profile", variant: "destructive" }),
      }
    );
  };

  if (isLoading) return (
    <div className="space-y-5 max-w-lg">
      <Skeleton className="h-8 w-24 rounded-lg" />
      <Skeleton className="h-40 rounded-lg" />
      <Skeleton className="h-28 rounded-lg" />
    </div>
  );

  if (!me) return null;

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-end justify-between">
        <div>
          <p className="section-label mb-1">Account</p>
          <h1 className="text-3xl font-extrabold tracking-tight">My Profile</h1>
        </div>
        {!editing && (
          <button
            onClick={handleEdit}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{ background: "hsl(var(--secondary))", color: "hsl(var(--foreground))" }}
            data-testid="btn-edit-profile"
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit
          </button>
        )}
      </div>

      {!editing ? (
        <div className="space-y-4">
          {/* Hero */}
          <div className="card-surface p-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shrink-0"
                style={{ background: "hsl(var(--secondary))" }}>
                {me.avatar}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-extrabold">{me.name}</h2>
                  {me.verified && (
                    <span className="flex items-center gap-1 text-[11px] font-bold" style={{ color: "#0B9ED9" }}>
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified
                    </span>
                  )}
                </div>
                <p className="text-sm mt-0.5 font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>{me.age} years old</p>
                <div className="flex flex-col gap-1 mt-3 text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
                  <span className="flex items-center gap-1.5"><Building className="w-3 h-3" />{me.gym || "No gym set"}</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{me.schedule || "No schedule set"}</span>
                </div>
              </div>
            </div>

            {me.bio && (
              <>
                <div className="divider my-4" />
                <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>{me.bio}</p>
              </>
            )}
          </div>

          {/* Interests */}
          <div className="card-surface p-5">
            <p className="section-label mb-3">Interests</p>
            <div className="flex flex-wrap gap-2">
              {me.interests.length > 0
                ? me.interests.map((i) => (
                    <span key={i} className="text-[12px] font-semibold px-3 py-1.5 rounded-lg"
                      style={{ background: "hsl(var(--secondary))", color: "hsl(var(--foreground))" }}>
                      {i}
                    </span>
                  ))
                : <span className="text-sm italic" style={{ color: "hsl(var(--muted-foreground))" }}>No interests added yet — tap Edit to add some</span>
              }
            </div>
          </div>

          {/* Sign out */}
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all"
            style={{ background: "hsl(var(--secondary))", color: "hsl(var(--muted-foreground))" }}
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="card-surface p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="section-label">Name</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-10 text-sm" data-testid="input-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="age" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="section-label">Age</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" className="h-10 text-sm" data-testid="input-age" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="bio" render={({ field }) => (
                <FormItem>
                  <FormLabel className="section-label">Bio</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} className="text-sm resize-none" data-testid="input-bio" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div>
                <p className="section-label mb-2">Gym</p>
                <Controller
                  control={form.control}
                  name="gymId"
                  render={() => (
                    <GymPicker
                      value={form.watch("gymId")}
                      selectedGymName={form.watch("gymName")}
                      onChange={(gymId, gymName) => {
                        form.setValue("gymId", gymId);
                        form.setValue("gymName", gymName);
                      }}
                    />
                  )}
                />
              </div>

              <FormField control={form.control} name="schedule" render={({ field }) => (
                <FormItem>
                  <FormLabel className="section-label">Schedule</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Mon-Fri 6PM" className="h-10 text-sm" data-testid="input-schedule" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div>
                <p className="section-label mb-3">Interests</p>
                <Controller
                  control={form.control}
                  name="interests"
                  render={({ field }) => (
                    <InterestPicker value={field.value} onChange={field.onChange} />
                  )}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={updateMe.isPending}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold text-white transition-all disabled:opacity-60"
                style={{ background: "hsl(var(--primary))" }}
                data-testid="btn-save-profile"
              >
                <Check className="w-4 h-4" />
                {updateMe.isPending ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
                style={{ background: "hsl(var(--secondary))", color: "hsl(var(--foreground))" }}
                data-testid="btn-cancel-edit"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
