const LoadingOverlay = () => {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="inset-0 bg-black bg-opacity-10 z-50 animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white"></div>
      <span className="text-xl font-bold text-center">Loading</span>
    </div>
  );
};

export default LoadingOverlay;