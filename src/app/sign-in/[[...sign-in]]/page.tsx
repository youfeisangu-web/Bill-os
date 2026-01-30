import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Bill OS</h1>
          <p className="mt-2 text-sm text-slate-600">ログインしてアカウントにアクセス</p>
        </div>
        <div className="flex justify-center">
          <SignIn
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "bg-white shadow-lg border border-slate-200",
                headerTitle: "text-slate-900",
                headerSubtitle: "text-slate-600",
                socialButtonsBlockButton: "border-slate-200 text-slate-900 hover:bg-slate-50",
                formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white",
                formFieldInput: "bg-white border-slate-200 text-slate-900",
                formFieldLabel: "text-slate-700",
                footerActionLink: "text-blue-600 hover:text-blue-700",
                identityPreviewText: "text-slate-900",
                identityPreviewEditButton: "text-blue-600 hover:text-blue-700",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
