export default function Privacy() {
  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">GymLink Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: May 19, 2026</p>

        <div className="space-y-6 text-sm leading-relaxed">
          <p>
            GymLink ("we," "us," or "our") operates the GymLink mobile and web applications (the
            "Service"). This Privacy Policy explains what information we collect, how we use it,
            and the choices you have. By using GymLink, you agree to the practices described
            below.
          </p>
          <p>
            If you have questions, contact us at{" "}
            <a className="text-primary underline" href="mailto:hello@gymlink.fit">
              hello@gymlink.fit
            </a>
            .
          </p>

          <h2 className="text-2xl font-semibold pt-4">1. Information We Collect</h2>
          <p>
            <strong>Account information you provide:</strong> name, age, password (stored
            encrypted using bcrypt — we never see your plaintext password), profile bio, gym you
            attend, workout interests, profile photo, workout videos you upload (limited to 2
            minutes each).
          </p>
          <p>
            <strong>Activity information:</strong> gym check-ins, connection requests (crush,
            buddy, advisor, spotter), notifications, likes on workout videos.
          </p>
          <p>
            <strong>Technical information:</strong> device type, operating system, basic app
            usage data, crash and error logs.
          </p>
          <p>
            We do <strong>not</strong> collect precise location data, contacts, browsing history
            outside the app, or financial information.
          </p>

          <h2 className="text-2xl font-semibold pt-4">2. How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Create and maintain your account</li>
            <li>Show you other GymLink members at your gym</li>
            <li>Let you send and receive connection requests</li>
            <li>Display profile photos and workout videos to other members</li>
            <li>Send you notifications about activity involving you</li>
            <li>Keep the Service secure and prevent abuse</li>
            <li>Improve the app and fix bugs</li>
          </ul>
          <p>
            We do <strong>not</strong> sell your personal information. We do <strong>not</strong>{" "}
            use your data for advertising.
          </p>

          <h2 className="text-2xl font-semibold pt-4">3. Information Shared with Other Users</h2>
          <p>
            Visible to other members: your name, age, bio, gym, interests, profile photo, workout
            videos, and whether you're currently checked in.
          </p>
          <p>Connection requests are visible only to you and the user you send them to.</p>
          <p>Your password and account-recovery info are never shown to other users.</p>

          <h2 className="text-2xl font-semibold pt-4">
            4. How We Store and Protect Your Information
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Account data stored in a secure PostgreSQL database</li>
            <li>Profile photos and workout videos stored in encrypted object storage</li>
            <li>Passwords hashed using bcrypt before being stored</li>
            <li>HTTPS for all communication between the app and our servers</li>
          </ul>
          <p>While we take reasonable steps, no system is 100% secure. You use the Service at your own risk.</p>

          <h2 className="text-2xl font-semibold pt-4">5. Your Rights and Choices</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>View and edit your profile in the app</li>
            <li>Delete content you've uploaded</li>
            <li>
              Delete your account by emailing{" "}
              <a className="text-primary underline" href="mailto:hello@gymlink.fit">
                hello@gymlink.fit
              </a>{" "}
              — we'll remove your account and associated personal data within 30 days
            </li>
          </ul>
          <p>
            EU, UK, and California residents have additional rights to request a copy of, correct,
            or delete personal data. Email us to exercise these rights.
          </p>

          <h2 className="text-2xl font-semibold pt-4">6. Children's Privacy</h2>
          <p>
            GymLink is intended for users <strong>17 years of age or older</strong>. We do not
            knowingly collect information from anyone under 17.
          </p>

          <h2 className="text-2xl font-semibold pt-4">7. Third-Party Services</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Replit</strong> — hosting and database
            </li>
            <li>
              <strong>Resend</strong> — transactional email
            </li>
            <li>
              <strong>Expo</strong> — mobile build and update delivery
            </li>
            <li>
              <strong>Apple</strong> — App Store distribution
            </li>
          </ul>

          <h2 className="text-2xl font-semibold pt-4">8. Data Retention</h2>
          <p>
            We keep account information while your account is active. After deletion, personal
            data is removed within 30 days except where law requires retention.
          </p>

          <h2 className="text-2xl font-semibold pt-4">9. International Users</h2>
          <p>
            GymLink is operated from the United States. Using the Service from outside the U.S.
            means your information is transferred to and stored in the U.S.
          </p>

          <h2 className="text-2xl font-semibold pt-4">10. Changes to This Policy</h2>
          <p>
            We may update this policy. We'll update the "Last updated" date and notify users in
            the app if changes are significant.
          </p>

          <h2 className="text-2xl font-semibold pt-4">11. Contact Us</h2>
          <p>
            <strong>Mindy Jenkins</strong>
            <br />
            Email:{" "}
            <a className="text-primary underline" href="mailto:hello@gymlink.fit">
              hello@gymlink.fit
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
