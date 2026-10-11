// EDIT THIS FILE to match your project. I could not inspect your repo, so verify both items below.
export const logo = "/logo.png";// <-- change to your real logo file/path


// Use your existing router paths. Set a value to null if that page does not exist yet.
export const routes = {
  home: '/',
  login: '/login',
  register: '/register',
  exams: '/exams',
  privacy: null, // e.g. '/privacy' once the page exists (footer hides null links)
  terms: null,
};

// On-page anchors used by the navbar (these always work, they point at homepage sections)
export const navLinks = [
  { label: 'Home', href: '#top', id: 'top' },
  { label: 'Explore Exams', href: '#exams', id: 'exams' },
  { label: 'Features', href: '#features', id: 'features' },
  { label: 'How It Works', href: '#how', id: 'how' },
];

export const socialLinks = {
  linkedin: 'https://github.com/Saurabhh0000/VidyaExam/tree/main',   // e.g. 'https://www.linkedin.com/company/<your-page>'
  instagram: 'https://github.com/Saurabhh0000/VidyaExam/tree/main',
  youtube: 'https://github.com/Saurabhh0000/VidyaExam/tree/main',
  facebook: 'https://github.com/Saurabhh0000/VidyaExam/tree/main',
  twitter: 'https://github.com/Saurabhh0000/VidyaExam/tree/main',    // X / Twitter profile URL
};