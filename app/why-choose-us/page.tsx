import { Shield, TrendingUp, Users, FileCheck, Headphones, BarChart } from "lucide-react";

export default function WhyChooseUsPage() {
  const features = [
    {
      icon: Shield,
      title: "Secure Transactions",
      description: "Bank-grade security for all your bidding and payment transactions. Your data and money are protected with industry-leading encryption.",
    },
    {
      icon: TrendingUp,
      title: "Real-time Bidding",
      description: "Live auction updates with instant bid notifications. Never miss an opportunity with real-time updates on your favorite vehicles.",
    },
    {
      icon: BarChart,
      title: "Market Insights",
      description: "Access to market trends and vehicle pricing data. Make informed decisions with comprehensive market analytics.",
    },
    {
      icon: Users,
      title: "Verified Buyers",
      description: "Join a network of trusted and verified partners. All users go through a verification process for your peace of mind.",
    },
    {
      icon: FileCheck,
      title: "Complete Documentation",
      description: "Vehicle history and legal documentation support. We assist with all paperwork and transfer processes.",
    },
    {
      icon: Headphones,
      title: "24/7 Support",
      description: "Dedicated support team to assist you throughout the process. Get help whenever you need it, day or night.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Why Choose Us</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            India&apos;s most trusted platform for tractor auctions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                    <Icon className="w-8 h-8 text-primary-600" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            );
          })}
        </div>

        {/* Additional Benefits */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold mb-6">Additional Benefits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2 text-lg">Transparent Process</h3>
              <p className="text-primary-100">
                Complete transparency in bidding, pricing, and vehicle information. No hidden charges or surprises.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-lg">Wide Selection</h3>
              <p className="text-primary-100">
                Access to thousands of vehicles across India. From used tractors to harvesters and scrap vehicles.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-lg">Flexible Membership</h3>
              <p className="text-primary-100">
                Start with a 15-day free trial, then choose from Silver, Gold, or Diamond membership plans.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-lg">Expert Assistance</h3>
              <p className="text-primary-100">
                Our team of experts helps you with vehicle inspection, valuation, and legal documentation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}






























