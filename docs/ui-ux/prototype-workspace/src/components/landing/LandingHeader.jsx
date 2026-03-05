import LanguageSwitcher from '../LanguageSwitcher';

function LandingHeader() {
  return (
    <header className="w-full py-4 px-6 flex justify-end bg-white">
      <LanguageSwitcher />
    </header>
  );
}

export default LandingHeader;
