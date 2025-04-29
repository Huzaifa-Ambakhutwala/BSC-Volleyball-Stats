import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (login(username, password)) {
      toast({
        title: "Login Successful",
        description: "Welcome to the admin panel",
      });
    } else {
      toast({
        title: "Login Failed",
        description: "Invalid username or password",
        variant: "destructive",
      });
    }
  };

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="bg-[hsl(var(--vb-blue))] text-white px-6 py-4">
            <h2 className="text-xl font-bold">Admin Panel</h2>
          </div>
          
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Login</h3>
            <form className="space-y-4 max-w-md" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input 
                  type="text" 
                  id="username" 
                  name="username" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[hsl(var(--vb-blue))] focus:border-[hsl(var(--vb-blue))]"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input 
                  type="password" 
                  id="password" 
                  name="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[hsl(var(--vb-blue))] focus:border-[hsl(var(--vb-blue))]"
                  required
                />
              </div>
              <button 
                type="submit" 
                className="w-full bg-[hsl(var(--vb-blue))] text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
              >
                Login
              </button>
            </form>
          </div>
          
          <div className="p-6 bg-gray-50">
            <h3 className="text-md font-medium mb-2">Admin Access</h3>
            <p className="text-sm text-gray-600">
              This panel is for tournament administrators only. If you need access, please contact your tournament director.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LoginForm;
