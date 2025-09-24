
"use client"

import { useState, useEffect } from "react"
import { useInsertUserOnAuth } from "./hooks/useInsertUserOnAuth"
import { useOnboardingStatus } from "./hooks/useOnboardingStatus"
import { OnboardingPopup } from "./components/OnboardingPopup"
import { motion } from "framer-motion"
import {
  Menu,
  X,
  ArrowRight,
  ChevronRight,
  Shield,
  Zap,
  Users,
  TrendingUp,
  CheckCircle,
  Star,
  Smartphone,
  CreditCard,
  Globe,
  DollarSign
} from "lucide-react"

// Utility function for className merging
const cn = (...classes: (string | undefined)[]) => {
  return classes.filter(Boolean).join(' ')
}

// Button Component
interface ButtonProps {
  children: React.ReactNode
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
  className?: string
  onClick?: () => void
  type?: "button" | "submit" | "reset"
  disabled?: boolean
}

const Button = ({ 
  children, 
  variant = "default", 
  size = "default", 
  className = "", 
  onClick,
  type = "button",
  disabled = false
}: ButtonProps) => {
  const baseStyles = "inline-flex items-center justify-center rounded-full font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed"
  
  const variants = {
    default: "bg-lime-400 text-black hover:bg-lime-300 shadow-lg hover:shadow-lime-400/25",
    outline: "border-2 border-lime-400 text-lime-400 hover:bg-lime-400 hover:text-black",
    ghost: "text-lime-400 hover:bg-lime-400/10"
  }

  const sizes = {
    default: "px-6 py-3 text-base",
    sm: "px-4 py-2 text-sm",
    lg: "px-8 py-4 text-lg"
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
    >
      {children}
    </button>
  )
}

// Card Component
interface CardProps {
  children: React.ReactNode
  className?: string
}

const Card = ({ children, className = "" }: CardProps) => (
  <div className={cn("bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl", className)}>
    {children}
  </div>
)

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemFadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
}

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [showOnboarding, setShowOnboarding] = useState(true)
  useInsertUserOnAuth();
  const { onboardingComplete } = useOnboardingStatus();

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (onboardingComplete === true) setShowOnboarding(false);
    else if (onboardingComplete === false) setShowOnboarding(true);
  }, [onboardingComplete]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (

    <div className="min-h-screen bg-black text-white">
      <OnboardingPopup show={showOnboarding && onboardingComplete === false} onClose={() => setShowOnboarding(false)} />

      {/* Mobile Menu */}
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black md:hidden"
        >
          <div className="container mx-auto flex h-16 items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-lime-400 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-black" />
              </div>
              <span className="font-bold text-xl text-lime-400">CryptoBazaar</span>
            </div>
            <button onClick={toggleMenu}>
              <X className="h-6 w-6" />
              <span className="sr-only">Close menu</span>
            </button>
          </div>
          <motion.nav
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="container mx-auto grid gap-4 px-6 pb-8 pt-6"
          >
            {["Features", "How It Works", "P2P Trading", "Reviews"].map((item, index) => (
              <motion.div key={index} variants={itemFadeIn}>                <a
                  href={item === "P2P Trading" ? "/exchange" : `#${item.toLowerCase().replace(" ", "-")}`}
                  className="flex items-center justify-between rounded-lg px-4 py-3 text-lg font-medium hover:bg-gray-900"
                  onClick={toggleMenu}
                >
                  {item}
                  <ChevronRight className="h-4 w-4" />
                </a>
              </motion.div>
            ))}
          </motion.nav>
        </motion.div>
      )}

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 md:py-32">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-lime-400/5 via-transparent to-black" />
          <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-lime-400/10 blur-3xl" />
          <div className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-lime-400/5 blur-3xl" />

          <div className="container mx-auto px-6">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
                className="space-y-8"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center rounded-full bg-lime-400/10 px-4 py-2 text-sm border border-lime-400/20"
                >
                  <Zap className="mr-2 h-4 w-4 text-lime-400" />
                  Secure P2P Crypto Trading
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                  className="text-4xl font-bold tracking-tight sm:text-5xl xl:text-6xl"
                >
                  Trade USDT{" "}
                  <span className="bg-gradient-to-r from-lime-400 to-green-400 bg-clip-text text-transparent">
                    Directly
                  </span>{" "}
                  with Anyone
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.4 }}
                  className="max-w-2xl text-xl text-gray-300 leading-relaxed"
                >
                  Buy and sell USDT peer-to-peer with UPI/GPay payments. Every trade is protected by our secure escrow system for complete peace of mind.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.6 }}
                  className="flex flex-col gap-4 sm:flex-row"
                >                  <Button 
                    size="lg" 
                    className="group"
                    onClick={() => window.location.href = '/exchange'}
                  >
                    Start Trading Now
                    <motion.span
                      initial={{ x: 0 }}
                      whileHover={{ x: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </motion.span>
                  </Button>
                  <Button variant="outline" size="lg">
                    Connect Wallet
                  </Button>
                </motion.div>

                {/* Trust Indicators */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.8 }}
                  className="flex items-center gap-8 pt-4"
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold text-lime-400">10K+</div>
                    <div className="text-sm text-gray-400">Active Traders</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-lime-400">₹50Cr+</div>
                    <div className="text-sm text-gray-400">Volume Traded</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-lime-400">99.9%</div>
                    <div className="text-sm text-gray-400">Uptime</div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Trading Interface Preview */}
              <motion.div
                initial={{ opacity: 0, x: 100 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="relative"
              >
                <Card className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold">Quick Trade</h3>
                    <div className="flex items-center gap-2 text-sm text-lime-400">
                      <div className="h-2 w-2 rounded-full bg-lime-400"></div>
                      Live Rates
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm text-gray-400">You Pay</label>
                      <div className="flex items-center gap-2 p-3 bg-gray-800 rounded-lg">
                        <span className="text-lg">₹</span>
                        <input 
                          type="number" 
                          placeholder="10,000" 
                          className="bg-transparent text-white text-lg font-medium outline-none flex-1"
                          defaultValue="10000"
                        />
                        <span className="text-sm text-gray-400">INR</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-gray-400">You Get</label>
                      <div className="flex items-center gap-2 p-3 bg-gray-800 rounded-lg">
                        <span className="text-lg">$</span>
                        <input 
                          type="number" 
                          placeholder="119.05" 
                          className="bg-transparent text-white text-lg font-medium outline-none flex-1"
                          defaultValue="119.05"
                        />
                        <span className="text-sm text-gray-400">USDT</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <span className="text-sm text-gray-400">Exchange Rate</span>
                    <span className="text-sm font-medium">1 USDT = ₹84.00</span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Payment Method</span>
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-lime-400" />
                        <span>UPI / GPay</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Escrow Protection</span>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-lime-400" />
                        <span>Enabled</span>
                      </div>
                    </div>
                  </div>                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => window.location.href = '/exchange'}
                  >
                    Find Sellers
                  </Button>
                </Card>

                {/* Floating Elements */}
                <motion.div
                  animate={{ y: [-10, 10, -10] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-4 -right-4 bg-lime-400 text-black px-3 py-1 rounded-full text-sm font-medium"
                >
                  Live
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 md:py-32">
          <div className="container mx-auto px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="text-center mb-16"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-block rounded-full bg-lime-400/10 px-4 py-2 text-sm mb-6 border border-lime-400/20"
              >
                Why Choose Us
              </motion.div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-6">
                Trade with <span className="text-lime-400">Confidence</span>
              </h2>
              <p className="mx-auto max-w-3xl text-xl text-gray-300">
                Our platform combines cutting-edge security with user-friendly design to make crypto trading accessible to everyone.
              </p>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
            >
              {[
                {
                  icon: <Shield className="h-12 w-12 text-lime-400" />,
                  title: "Escrow Protection",
                  description: "Every trade is secured by our automated escrow system. Your funds are safe until both parties confirm the transaction."
                },
                {
                  icon: <Zap className="h-12 w-12 text-lime-400" />,
                  title: "Instant Settlements",
                  description: "Complete trades in minutes with UPI and GPay integration. No waiting for bank transfers or complex procedures."
                },
                {
                  icon: <Users className="h-12 w-12 text-lime-400" />,
                  title: "Verified Users",
                  description: "Trade with confidence knowing all users go through our comprehensive KYC verification process."
                },
                {
                  icon: <TrendingUp className="h-12 w-12 text-lime-400" />,
                  title: "Best Rates",
                  description: "Get competitive exchange rates with our dynamic pricing algorithm that tracks real-time market data."
                },
                {
                  icon: <Globe className="h-12 w-12 text-lime-400" />,
                  title: "24/7 Trading",
                  description: "Trade anytime, anywhere. Our platform is available round the clock with dedicated customer support."
                },
                {
                  icon: <CreditCard className="h-12 w-12 text-lime-400" />,
                  title: "Multiple Payment Options",
                  description: "Support for UPI, GPay, PhonePe, and other popular payment methods for seamless transactions."
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  variants={itemFadeIn}
                  whileHover={{ y: -10, transition: { duration: 0.3 } }}
                  className="group relative overflow-hidden rounded-xl border border-gray-800 p-8 bg-gray-900/30 hover:bg-gray-900/50 transition-all duration-300"
                >
                  <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-lime-400/5 group-hover:bg-lime-400/10 transition-all duration-300"></div>
                  <div className="relative space-y-4">
                    <div className="mb-4">{feature.icon}</div>
                    <h3 className="text-xl font-bold">{feature.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 md:py-32 bg-gray-900/20">
          <div className="container mx-auto px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="text-center mb-16"
            >
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-6">
                How It <span className="text-lime-400">Works</span>
              </h2>
              <p className="mx-auto max-w-3xl text-xl text-gray-300">
                Start trading in just three simple steps. Our streamlined process makes crypto trading accessible to everyone.
              </p>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid gap-8 md:grid-cols-3"
            >
              {[
                {
                  step: "01",
                  title: "Create Account",
                  description: "Sign up and complete our quick KYC verification process. Link your UPI or GPay account for seamless payments.",
                  icon: <Users className="h-8 w-8" />
                },
                {
                  step: "02",
                  title: "Find Traders",
                  description: "Browse verified buyers and sellers. Compare rates, check reviews, and choose the best deal for your trade.",
                  icon: <TrendingUp className="h-8 w-8" />
                },
                {
                  step: "03",
                  title: "Trade Securely",
                  description: "Initiate trade with escrow protection. Complete payment via UPI/GPay and receive your USDT instantly.",
                  icon: <Shield className="h-8 w-8" />
                }
              ].map((step, index) => (
                <motion.div
                  key={index}
                  variants={itemFadeIn}
                  className="relative text-center"
                >
                  <div className="mb-6 mx-auto w-16 h-16 rounded-full bg-lime-400/10 border-2 border-lime-400 flex items-center justify-center text-lime-400 font-bold text-xl">
                    {step.step}
                  </div>
                  <div className="mb-4 mx-auto w-12 h-12 rounded-full bg-lime-400 flex items-center justify-center text-black">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-4">{step.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{step.description}</p>
                  {index < 2 && (
                    <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-lime-400 to-transparent"></div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-20 md:py-32 bg-gray-900/20">
          <div className="container mx-auto px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="text-center mb-16"
            >
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-6">
                What Our <span className="text-lime-400">Users Say</span>
              </h2>
              <p className="mx-auto max-w-3xl text-xl text-gray-300">
                Join thousands of satisfied traders who trust our platform for their crypto transactions.
              </p>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
            >
              {[
                {
                  name: "Priya Sharma",
                  role: "Freelancer",
                  content: "CryptoBazaar made my first crypto purchase so easy! The escrow system gave me confidence, and UPI payment was instant.",
                  rating: 5
                },
                {
                  name: "Rahul Gupta",
                  role: "Business Owner",
                  content: "I've been trading here for 6 months. Great rates, fast transactions, and excellent customer support. Highly recommended!",
                  rating: 5
                },
                {
                  name: "Anita Patel",
                  role: "Student",
                  content: "The verification process was quick and the interface is very user-friendly. Perfect for beginners like me.",
                  rating: 5
                },
                {
                  name: "Vikram Singh",
                  role: "Trader",
                  content: "Best P2P platform in India. Security is top-notch and I've never had any issues with payments or withdrawals.",
                  rating: 5
                },
                {
                  name: "Meera Reddy",
                  role: "Investor",
                  content: "Love the real-time rates and the variety of payment options. Makes crypto trading accessible to everyone.",
                  rating: 5
                },
                {
                  name: "Arjun Kumar",
                  role: "Developer",
                  content: "Clean interface, robust security, and excellent execution. This is how crypto trading should be done.",
                  rating: 5
                }
              ].map((testimonial, index) => (
                <motion.div
                  key={index}
                  variants={itemFadeIn}
                  whileHover={{ y: -5 }}
                  className="rounded-xl border border-gray-800 p-6 bg-gray-900/30 hover:bg-gray-900/50 transition-all duration-300"
                >
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-lime-400 text-lime-400" />
                    ))}
                  </div>
                  <blockquote className="text-gray-300 mb-6 leading-relaxed">
                    "{testimonial.content}"
                  </blockquote>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-lime-400/20 flex items-center justify-center">
                      <span className="text-lime-400 font-semibold">
                        {testimonial.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-white">{testimonial.name}</div>
                      <div className="text-sm text-gray-400">{testimonial.role}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="text-center space-y-8"
            >
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Ready to Start <span className="text-lime-400">Trading?</span>
              </h2>
              <p className="mx-auto max-w-2xl text-xl text-gray-300">
                Join thousands of users who trust CryptoBazaar for secure, fast, and reliable crypto trading.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="group"
                >
                  Get Started Now
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button variant="outline" size="lg">
                  Contact Support
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-900/50">
        <div className="container mx-auto px-6 py-12">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-lime-400 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-black" />
                </div>
                <span className="font-bold text-lg text-lime-400">CryptoBazaar</span>
              </div>
              <p className="text-gray-400 text-sm">
                The most trusted P2P crypto exchange platform in India. Trade USDT securely with escrow protection.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Platform</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <a href="#" className="block hover:text-lime-400 transition-colors">How It Works</a>
                <a href="#" className="block hover:text-lime-400 transition-colors">Security</a>
                <a href="#" className="block hover:text-lime-400 transition-colors">Fees</a>
                <a href="#" className="block hover:text-lime-400 transition-colors">API</a>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Support</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <a href="#" className="block hover:text-lime-400 transition-colors">Help Center</a>
                <a href="#" className="block hover:text-lime-400 transition-colors">Contact Us</a>
                <a href="#" className="block hover:text-lime-400 transition-colors">Status</a>
                <a href="#" className="block hover:text-lime-400 transition-colors">Bug Bounty</a>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Legal</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <a href="#" className="block hover:text-lime-400 transition-colors">Privacy Policy</a>
                <a href="#" className="block hover:text-lime-400 transition-colors">Terms of Service</a>
                <a href="#" className="block hover:text-lime-400 transition-colors">Cookie Policy</a>
                <a href="#" className="block hover:text-lime-400 transition-colors">Compliance</a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} CryptoBazaar. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
