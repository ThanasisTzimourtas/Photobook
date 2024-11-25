import PhotoBook from '@/components/PhotoBook';

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-rose-100"> 
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">   Afroditi&apos;s PhotoBook
        </h1>
        <PhotoBook />
      </div>
    </main>
  );
}
