// components/Footer.tsx
import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white text-center p-4 mt-8">
      <div className="container mx-auto">
        <p>&copy; {new Date().getFullYear()} Stabo.world. All Rights Reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;