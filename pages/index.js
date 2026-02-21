// pages/index.js
// Redirects to the main app HTML file
export default function Home() {
  // The app lives at /app.html in the public folder
  // We redirect there so the URL stays clean
  if (typeof window !== 'undefined') {
    window.location.href = '/app.html'
  }
  return null
}

export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/app.html',
      permanent: false,
    },
  }
}
