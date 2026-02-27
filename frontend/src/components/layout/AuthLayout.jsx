const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-950 px-4 transition-colors duration-300">
      {children}
    </div>
  );
};

export default AuthLayout;