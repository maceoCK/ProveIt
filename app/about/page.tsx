export default function AboutPage() {
  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">About ProveIt</h1>
      
      <div className="space-y-6 text-lg">
        <p className="bg-accent p-6 rounded-lg">
          Are you sure you can finish your tasks on time? <span className="font-bold">Prove It.</span>
        </p>

        <p>
          We are a non-profit organization that helps make sure YOU stay on track and get your tasks done, 
          or else your pledged amount will be automatically donated to causes that help women & girls 
          all around the world!
        </p>

        <p className="text-primary font-semibold">
          But isn't that a win-win anyway?
        </p>

        <div className="border-t pt-6">
          <h2 className="text-2xl font-bold mb-4">Where 100% of contributions are donated:</h2>
          <ul className="space-y-3 list-disc pl-6">
            <li><a href="https://malala.org/" target="_blank" className="text-primary hover:underline">The Malala Fund</a></li>
            <li><a href="https://www.womenforwomen.org/" target="_blank" className="text-primary hover:underline">Women for Women International</a></li>
            <li><a href="https://womendeliver.org/" target="_blank" className="text-primary hover:underline">Women Deliver</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
} 