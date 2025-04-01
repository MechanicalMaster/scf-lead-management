import LoginForm from "@/components/SCFleadmanagement/login-form"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-slate-100 to-slate-200 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="relative w-full max-w-md">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-white dark:bg-[#1F1F23] rounded-2xl shadow-xl overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-blue-500"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-blue-600"></div>
            <div className="grid grid-cols-10 grid-rows-10 gap-4 absolute inset-0">
              {Array.from({ length: 20 }).map((_, i) => (
                <div 
                  key={i}
                  className="w-2 h-2 rounded-full bg-blue-500"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    opacity: Math.random() * 0.5 + 0.2
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="relative bg-white dark:bg-[#1F1F23] rounded-2xl shadow-xl overflow-hidden p-8">
          <div className="mb-8 flex flex-col items-center">
            <div className="h-14 w-14 rounded-full bg-blue-600 flex items-center justify-center mb-4">
              <span className="font-bold text-2xl text-white">SCF</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Lead Management
            </h1>
          </div>
          
          <LoginForm />
          
          <div className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
            © 2025 Yes Bank SCF Division. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  )
} 