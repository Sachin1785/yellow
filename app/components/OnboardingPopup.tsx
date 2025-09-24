import { useEffect } from 'react';

export function OnboardingPopup({ show, onClose }: { show: boolean, onClose: () => void }) {
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [show]);

  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white text-black rounded-lg p-8 max-w-md w-full shadow-xl relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-black">✕</button>
        <h2 className="text-2xl font-bold mb-4">Finish Your Onboarding</h2>
        <p className="mb-6">To access all features, please complete your onboarding process.</p>
        <a href="/signup" className="inline-block bg-lime-400 text-black px-6 py-2 rounded-full font-semibold hover:bg-lime-300 transition">Complete Onboarding</a>
      </div>
    </div>
  );
}
