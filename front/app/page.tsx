import SignUpForm from "@/components/auth/signup-form";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            新規登録
          </h2>
        </div>
        <SignUpForm />
      </div>
    </div>
  );
}
