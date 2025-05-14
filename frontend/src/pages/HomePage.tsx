import React from "react";
import { githubService } from "../services/githubService";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import heroBgSvg from "../assets/hero-bg.svg";
import umlBannerSvg from "../assets/images/uml-banner.svg";
import featuresIllustrationSvg from "../assets/images/features-illustration.svg";
import howItWorksSvg from "../assets/images/how-it-works.svg";
import testimonialBgSvg from "../assets/images/testimonial-bg.svg";
import faviconSvg from "../assets/images/favicon.svg";

const HomePage: React.FC = () => {
  const handleGitHubLogin = () => {
    githubService.initiateOAuth();
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 to-neutral-50 pb-32 pt-20 md:pt-32 md:pb-40">
        <div
          className="absolute inset-0 opacity-70 z-0"
          style={{
            backgroundImage: `url(${heroBgSvg})`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        ></div>
        <div className="relative container-custom z-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="max-w-lg mx-auto md:mx-0 text-center md:text-left relative z-20">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-900">
                <span className="block">UMLCraft</span>
                <span className="block mt-2 bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
                  Code Visualization Made Easy
                </span>
              </h1>
              <p className="mt-6 text-lg md:text-xl text-neutral-600 leading-relaxed">
                Connect your GitHub account, select repositories, and generate
                interactive UML diagrams automatically. Visualize your code
                structure and relationships with ease.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row justify-center md:justify-start gap-4 relative z-30">
                <button
                  onClick={handleGitHubLogin}
                  className="btn-primary px-8 py-3 text-base md:text-lg rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hero-button"
                >
                  <span className="flex items-center justify-center">
                    <svg
                      className="h-6 w-6 mr-2"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Connect with GitHub
                  </span>
                </button>
                <a
                  href="#features"
                  className="btn-outline px-8 py-3 text-base md:text-lg rounded-lg hero-button"
                >
                  Learn More
                </a>
              </div>
            </div>
            <div className="hidden md:block relative z-10">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-3xl blur-lg opacity-75 animate-pulse-slow"></div>
              <div className="relative bg-white p-6 rounded-3xl shadow-xl">
                <div className="w-full h-80 bg-neutral-100 rounded-lg overflow-hidden">
                  {/* UML banner SVG instead of placeholder */}
                  <img
                    src={umlBannerSvg}
                    alt="UML Class Diagram"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave separator - moved lower to avoid overlapping buttons */}
        <div className="absolute -bottom-1 left-0 right-0 z-0 wave-separator">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
            <path
              fill="#ffffff"
              fillOpacity="1"
              d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,202.7C672,203,768,181,864,186.7C960,192,1056,224,1152,218.7C1248,213,1344,171,1392,149.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            ></path>
          </svg>
        </div>
      </section>

      {/* Features section */}
      <section id="features" className="py-20 bg-white relative z-30">
        <div className="container-custom relative">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900">
              Powerful Features
            </h2>
            <p className="mt-4 text-xl text-neutral-600 max-w-3xl mx-auto">
              Everything you need to visualize and understand your code
              structure
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-20">
            <div className="card group hover:border-primary-500 hover:border transition-all duration-300 relative z-30">
              <div className="h-12 w-12 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center mb-6 group-hover:bg-primary-600 group-hover:text-white transition-colors duration-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                GitHub Integration
              </h3>
              <p className="text-neutral-600">
                Seamlessly connect to your GitHub repositories and generate UML
                diagrams from your code with a single click.
              </p>
            </div>

            <div className="card group hover:border-primary-500 hover:border transition-all duration-300">
              <div className="h-12 w-12 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center mb-6 group-hover:bg-primary-600 group-hover:text-white transition-colors duration-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                Interactive Diagrams
              </h3>
              <p className="text-neutral-600">
                Create interactive UML diagrams that you can manipulate, zoom,
                and customize to match your needs.
              </p>
            </div>

            <div className="card group hover:border-primary-500 hover:border transition-all duration-300">
              <div className="h-12 w-12 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center mb-6 group-hover:bg-primary-600 group-hover:text-white transition-colors duration-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                Export Options
              </h3>
              <p className="text-neutral-600">
                Export your UML diagrams in multiple formats including PNG, SVG,
                and PDF for easy sharing and documentation.
              </p>
            </div>
          </div>

          {/* Add features illustration under the features grid */}
          <div className="mt-20 flex justify-center">
            <img
              src={featuresIllustrationSvg}
              alt="AI-Powered UML Generation Process"
              className="w-full max-w-4xl rounded-lg shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* How it works section */}
      <section className="py-20 bg-neutral-50">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900">
              How It Works
            </h2>
            <p className="mt-4 text-xl text-neutral-600 max-w-3xl mx-auto">
              Generate UML diagrams in three simple steps
            </p>
          </div>

          {/* Use the how-it-works SVG for the process illustration */}
          <div className="flex justify-center mb-16">
            <img
              src={howItWorksSvg}
              alt="How UML Generator Works"
              className="w-full max-w-5xl"
            />
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-primary-100"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
              {/* Step 1 */}
              <div className="md:col-start-1 flex md:justify-end relative z-10">
                <div className="w-full md:w-5/6 card">
                  <div className="bg-primary-100 w-10 h-10 rounded-full flex items-center justify-center text-primary-600 font-bold mb-4 absolute -left-5 top-10 md:hidden">
                    1
                  </div>
                  <div className="hidden md:flex absolute -right-14 top-10 items-center justify-center w-12 h-12 rounded-full bg-primary-600 shadow-lg z-10">
                    <span className="text-white font-bold">1</span>
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-4">
                    Connect Your GitHub
                  </h3>
                  <p className="text-neutral-600 mb-4">
                    Securely link your GitHub account to access your
                    repositories. We only request the permissions needed to read
                    your code.
                  </p>
                  <button
                    onClick={handleGitHubLogin}
                    className="btn-primary inline-flex items-center"
                  >
                    <svg
                      className="h-5 w-5 mr-2"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Connect with GitHub
                  </button>
                </div>
              </div>

              {/* Empty space for step 1 on mobile / tablet */}
              <div className="hidden md:block md:col-start-2"></div>

              {/* Step 2 */}
              <div className="md:col-start-2 flex md:justify-start relative z-10">
                <div className="w-full md:w-5/6 card">
                  <div className="bg-primary-100 w-10 h-10 rounded-full flex items-center justify-center text-primary-600 font-bold mb-4 absolute -left-5 top-10 md:hidden">
                    2
                  </div>
                  <div className="hidden md:flex absolute -left-14 top-10 items-center justify-center w-12 h-12 rounded-full bg-primary-600 shadow-lg z-10">
                    <span className="text-white font-bold">2</span>
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-4">
                    Select Your Repository
                  </h3>
                  <p className="text-neutral-600 mb-4">
                    Choose the repository you want to analyze. Navigate through
                    the file structure to select specific folders or files.
                  </p>
                  <div className="flex justify-center">
                    <img
                      src={faviconSvg}
                      alt="Repository selection"
                      className="w-24 h-24 object-contain"
                    />
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="md:col-start-1 flex md:justify-end relative z-10">
                <div className="w-full md:w-5/6 card">
                  <div className="bg-primary-100 w-10 h-10 rounded-full flex items-center justify-center text-primary-600 font-bold mb-4 absolute -left-5 top-10 md:hidden">
                    3
                  </div>
                  <div className="hidden md:flex absolute -right-14 top-10 items-center justify-center w-12 h-12 rounded-full bg-primary-600 shadow-lg z-10">
                    <span className="text-white font-bold">3</span>
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-4">
                    Generate UML Diagrams
                  </h3>
                  <p className="text-neutral-600 mb-4">
                    Our system will analyze your code and generate comprehensive
                    UML diagrams. You can customize, edit, and export them in
                    various formats.
                  </p>
                  <div className="flex justify-center">
                    <img
                      src={umlBannerSvg}
                      alt="UML diagram generation"
                      className="w-full h-40 object-cover rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA section with testimonial background */}
      <section className="py-20 bg-primary-600 text-white relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10 z-0"
          style={{
            backgroundImage: `url(${testimonialBgSvg})`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        ></div>
        <div className="container-custom relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Visualize Your Code with UMLCraft?
            </h2>
            <p className="text-xl opacity-90 mb-10">
              Generate UML diagrams for your GitHub repositories in minutes. No
              configuration needed.
            </p>
            <button
              onClick={handleGitHubLogin}
              className="inline-flex items-center justify-center bg-white text-primary-600 hover:bg-neutral-100 transition-colors px-8 py-3 text-lg font-medium rounded-lg shadow-lg"
            >
              <svg
                className="h-6 w-6 mr-2"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
              Get Started with GitHub
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;
