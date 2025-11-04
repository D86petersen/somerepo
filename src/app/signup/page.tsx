"use client";

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleSignup = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (error) {
      alert(error.message);
    } else {
      alert('Check your email to verify your account!');
      router.push('/login');
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });

    if (error) {
      alert(error.message);
    }
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display dark group/design-root overflow-x-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-black/60"></div>
        <div
          className="h-full w-full bg-center bg-no-repeat bg-cover"
          style={{
            backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuAv9g4cnWQGiFGWEqM-7_6NT4V1W6BA1P63QVD4K9yQFxYiCkdsPT0jLOMpe4dzud8HQ4St-X5_Nv3FPwdDm2TE_G2l5C4OOZWQx5B3FQRmob0WDs3gkow7grhKgX_dCEvxebwvf7NE7pYenKpKukPZXwXsGcPcjJokhHOMiNQNVzflwIwHH1O9nbLNl5PHpb0W4n_-Z4c4rOwcUeV8mffrE0mSVys0_Qd_xAy4pNeGBUqX_tsdLN18Ut0a6Me2mtd9hgTYCONnG8eS")`,
          }}
        ></div>
      </div>
      <div className="relative z-10 flex w-full grow flex-col justify-center px-4 py-8 sm:px-6 md:px-8">
        <div className="mx-auto flex w-full max-w-md flex-col items-center">
          <div className="mb-6 flex items-center justify-center">
            <h1 className="text-5xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-red-500 to-white bg-clip-text text-transparent">WiZiX</span>
              <span className="text-white"> Degenerates</span>
            </h1>
          </div>
          <h1 className="text-white tracking-light text-[32px] font-bold leading-tight text-center pb-8">Create Your Account</h1>
          <div className="w-full space-y-4">
            <label className="flex w-full flex-col min-w-40 flex-1">
              <p className="text-white text-base font-medium leading-normal pb-2">Full Name</p>
              <input
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border-none bg-black/30 backdrop-blur-sm h-14 placeholder:text-slate-400 p-4 text-base font-normal leading-normal"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="flex w-full flex-col min-w-40 flex-1">
              <p className="text-white text-base font-medium leading-normal pb-2">Email Address</p>
              <input
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border-none bg-black/30 backdrop-blur-sm h-14 placeholder:text-slate-400 p-4 text-base font-normal leading-normal"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="flex w-full flex-col min-w-40 flex-1">
              <p className="text-white text-base font-medium leading-normal pb-2">Password</p>
              <div className="flex w-full flex-1 items-stretch rounded-xl">
                <input
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-l-xl text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border-none bg-black/30 backdrop-blur-sm h-14 placeholder:text-slate-400 p-4 rounded-r-none border-r-0 pr-2 text-base font-normal leading-normal"
                  placeholder="Create a password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div
                  className="text-slate-400 flex border-none bg-black/30 backdrop-blur-sm items-center justify-center pr-4 rounded-r-xl border-l-0 cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </div>
              </div>
            </label>
          </div>
          <div className="w-full mt-8 space-y-4">
            <button
              className="flex h-14 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-primary px-5 py-3 text-base font-semibold leading-none text-white transition-all hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              onClick={handleSignup}
            >
              Sign Up
            </button>
            <p className="text-center text-slate-300">Already have an account? <a className="font-semibold text-white underline hover:text-primary/90 transition-colors" href="/login">Log In</a></p>
          </div>
          <div className="my-8 flex w-full items-center gap-4">
            <hr className="w-full border-slate-700" />
            <p className="flex-shrink-0 text-sm font-medium text-slate-400">OR</p>
            <hr className="w-full border-slate-700" />
          </div>
          <div className="w-full space-y-4">
            <button
              className="flex h-14 w-full items-center justify-center gap-3 whitespace-nowrap rounded-xl border border-slate-700 bg-black/20 px-5 py-3 text-base font-medium leading-none text-white transition-all hover:bg-black/40"
              onClick={handleGoogleLogin}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g clipPath="url(#clip0_3227_6325)"><path d="M23.766 12.2727C23.766 11.4909 23.698 10.7091 23.562 9.95455H12.12V14.3182H18.666C18.384 15.7955 17.634 17.0682 16.518 17.8364V20.5909H20.19C22.422 18.5 23.766 15.6364 23.766 12.2727Z" fill="#4285F4"></path><path d="M12.12 24C15.228 24 17.868 22.9318 19.686 21.0955L16.518 18.3409C15.468 19.0409 13.932 19.4773 12.12 19.4773C8.82 19.4773 6.012 17.2955 5.052 14.4H1.242V17.2455C3.06 21.2182 7.218 24 12.12 24Z" fill="#34A853"></path><path d="M5.052 14.4C4.842 13.7545 4.71 13.0682 4.71 12.3636C4.71 11.6591 4.83 10.9727 5.052 10.3182V7.47273H1.242C0.45 9.04545 0 10.6591 0 12.3636C0 14.0682 0.45 15.6818 1.242 17.2455L5.052 14.4Z" fill="#FBBC05"></path><path d="M12.12 4.52273C13.686 4.52273 15.018 5.07273 16.038 6.03182L19.764 2.3C17.856 0.877273 15.228 0 12.12 0C7.218 0 3.06 2.78182 1.242 6.75455L5.052 9.6C6.012 6.70455 8.82 4.52273 12.12 4.52273Z" fill="#EA4335"></path></g><defs><clipPath id="clip0_3227_6325"><rect fill="white" height="24" width="24"></rect></clipPath></defs></svg>
              Continue with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
