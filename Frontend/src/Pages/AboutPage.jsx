import { FaCode, FaMicrochip, FaFileCode, FaBolt } from "react-icons/fa";
import { Link } from "react-router-dom";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-blue-100 md:px-20">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-5xl font-bold mb-8 text-center text-blue-400">
          About Progrify
        </h1>

        <div className="bg-gray-800 border border-blue-800 rounded-lg p-6 mb-12">
          <div className="mb-6">
            <h2 className="text-2xl text-blue-400">AI-Powered Code Editing</h2>
            <p className="text-gray-200">Revolutionizing the way you write code</p>
          </div>
          <div className="mb-6 text-lg">
            <p className="text-gray-200">
              CodeAI Editor is an advanced, AI-powered code editor designed to
              enhance your coding experience. With intelligent suggestions,
              real-time error detection, and seamless integration with CopilotKit,
              we're redefining what it means to write code efficiently.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <FeatureCard
              icon={<FaFileCode className="h-8 w-8 text-blue-500" />}
              title="Multi-Language Support"
              description="Write code in Python, C, C++, and JavaScript with ease."
            />
            <FeatureCard
              icon={<FaMicrochip className="h-8 w-8 text-blue-500" />}
              title="AI-Powered Assistance"
              description="Get intelligent code suggestions and auto-completions."
            />
            <FeatureCard
              icon={<FaCode className="h-8 w-8 text-blue-500" />}
              title="CopilotKit Integration"
              description="Seamless integration with GitHub Copilot for enhanced coding."
            />
            <FeatureCard
              icon={<FaBolt className="h-8 w-8 text-blue-500" />}
              title="Interactive UI"
              description="Copilot interacts directly with the UI for a smoother experience."
            />
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-semibold mb-6 text-blue-500">
            Ready to revolutionize your coding?
          </h2>
          <Link to="/home">
            <a className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg transition duration-300 inline-block">
              Get Started Now
            </a>
          </Link>

        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-gray-700 border border-blue-500 hover:border-blue-400 rounded-lg p-4 transition duration-300">
      <div className="flex items-center gap-3 mb-4">
        {icon}
        <h3 className="text-xl text-blue-400">{title}</h3>
      </div>
      <p className="text-gray-100">{description}</p>
    </div>
  );
}
