"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"

// Add type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string }) => Promise<any>;
    };
  }
}
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Checkbox } from "../components/ui/checkbox"
import { Progress } from "../components/ui/progress"
import { ArrowLeft, ArrowRight, Check, User, MapPin, CreditCard, FileText } from "lucide-react"

interface FormData {
  // Step 1: Basic Info
  firstName: string
  lastName: string
  email: string
  phone: string

  // Step 2: Personal Details
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  zipCode: string
  dateOfBirth: string
  gender: string

  // Step 3: Bank Details
  bankName: string
  accountNumber: string
  ifsc: string

  // Step 4: Agreement
  termsAccepted: boolean
  privacyAccepted: boolean
  marketingAccepted: boolean

  // MetaMask Wallet
  walletAddress: string
}

const steps = [
  { id: 1, title: "Basic Information", icon: User, description: "Enter your basic details" },
  { id: 2, title: "Personal Details", icon: MapPin, description: "Complete your profile" },
  { id: 3, title: "Bank Information", icon: CreditCard, description: "Add your banking details" },
  { id: 4, title: "Terms & Agreement", icon: FileText, description: "Review and accept terms" },
]

export default function SignupPage() {
  const { user } = useUser();
  const [currentStep, setCurrentStep] = useState(1)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zipCode: "",
    dateOfBirth: "",
    gender: "",
    bankName: "",
    accountNumber: "",
    ifsc: "",
    termsAccepted: false,
    privacyAccepted: false,
    marketingAccepted: false,
    walletAddress: "",
  })

  // MetaMask connect logic
  const [walletError, setWalletError] = useState<string>("");
  const connectWallet = async () => {
    setWalletError("");
    if (typeof window.ethereum === "undefined") {
      setWalletError("MetaMask is not installed. Please install MetaMask and try again.");
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (accounts && accounts[0]) {
        updateFormData("walletAddress", accounts[0]);
      } else {
        setWalletError("No wallet address found.");
      }
    } catch (err: any) {
      setWalletError(err.message || "Failed to connect wallet.");
    }
  };

  const updateFormData = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.firstName && formData.lastName && formData.email && formData.phone)
      case 2:
        return !!(
          formData.addressLine1 &&
          formData.city &&
          formData.state &&
          formData.zipCode &&
          formData.dateOfBirth
        )
      case 3:
        return !!(formData.bankName && formData.accountNumber && formData.ifsc)
      case 4:
        return formData.termsAccepted && formData.privacyAccepted && !!formData.walletAddress
      default:
        return true
    }
  }

  const nextStep = () => {
    if (currentStep < 4 && validateStep(currentStep)) {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentStep(currentStep + 1)
        setIsTransitioning(false)
      }, 150)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentStep(currentStep - 1)
        setIsTransitioning(false)
      }, 150)
    }
  }

  const handleSubmit = () => {
    if (validateStep(4)) {
      const clerkId = user?.id;
      if (!clerkId) {
        alert("User not authenticated");
        return;
      }
      fetch("/api/user/complete-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, clerkId }),
      })
        .then(async (res) => {
          if (!res.ok) throw new Error("Failed to complete onboarding");
          window.location.href = "/";
        })
        .catch((err) => {
          alert("Error: " + err.message);
        });
    }
  }

  const progress = (currentStep / 4) * 100

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8 animate-in fade-in duration-500">
          <h1 className="text-4xl font-bold text-foreground mb-2">Create Your Account</h1>
          <p className="text-muted-foreground">Join us today and get started in minutes</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={progress} className="h-2 mb-4 transition-all duration-500 ease-out" />
          <div className="flex justify-between">
            {steps.map((step) => {
              const Icon = step.icon
              const isActive = currentStep === step.id
              const isCompleted = currentStep > step.id

              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-300 transform ${
                      isCompleted
                        ? "bg-primary text-primary-foreground scale-110"
                        : isActive
                          ? "bg-primary text-primary-foreground scale-110 animate-pulse"
                          : "bg-muted text-muted-foreground hover:scale-105"
                    }`}
                  >
                    {isCompleted ? <Check className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                  </div>
                  <div className="text-center">
                    <p
                      className={`text-sm font-medium transition-colors duration-200 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                    >
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground hidden sm:block">{step.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Form Card */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-2xl text-foreground">
              Step {currentStep}: {steps[currentStep - 1].title}
            </CardTitle>
            <CardDescription className="text-muted-foreground">{steps[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div
              className={`transition-all duration-300 ${isTransitioning ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"}`}
            >
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div className="space-y-4 animate-in slide-in-from-right duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-foreground">
                        First Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="firstName"
                        placeholder="Enter your first name"
                        value={formData.firstName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData("firstName", e.target.value)}
                        className="bg-input border-border text-foreground transition-all duration-200 focus:scale-[1.02] focus:shadow-lg"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-foreground">
                        Last Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="lastName"
                        placeholder="Enter your last name"
                        value={formData.lastName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData("lastName", e.target.value)}
                        className="bg-input border-border text-foreground transition-all duration-200 focus:scale-[1.02] focus:shadow-lg"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-foreground">
                        Email Address <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData("email", e.target.value)}
                        className="bg-input border-border text-foreground transition-all duration-200 focus:scale-[1.02] focus:shadow-lg"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-foreground">
                        Phone Number <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="phone"
                        placeholder="(555) 123-4567"
                        value={formData.phone}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData("phone", e.target.value)}
                        className="bg-input border-border text-foreground transition-all duration-200 focus:scale-[1.02] focus:shadow-lg"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Personal Details */}
              {currentStep === 2 && (
                <div className="space-y-4 animate-in slide-in-from-right duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="addressLine1" className="text-foreground">
                        Address Line 1 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="addressLine1"
                        placeholder="Flat, House no., Building, Company, Apartment"
                        value={formData.addressLine1}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData("addressLine1", e.target.value)}
                        className="bg-input border-border text-foreground transition-all duration-200 focus:scale-[1.02] focus:shadow-lg"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addressLine2" className="text-foreground">
                        Address Line 2
                      </Label>
                      <Input
                        id="addressLine2"
                        placeholder="Area, Street, Sector, Village"
                        value={formData.addressLine2}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData("addressLine2", e.target.value)}
                        className="bg-input border-border text-foreground transition-all duration-200 focus:scale-[1.02] focus:shadow-lg"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-foreground">
                        City <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="city"
                        placeholder="City"
                        value={formData.city}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData("city", e.target.value)}
                        className="bg-input border-border text-foreground transition-all duration-200 focus:scale-[1.02] focus:shadow-lg"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state" className="text-foreground">
                        State <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="state"
                        placeholder="State"
                        value={formData.state}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData("state", e.target.value)}
                        className="bg-input border-border text-foreground transition-all duration-200 focus:scale-[1.02] focus:shadow-lg"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode" className="text-foreground">
                        ZIP Code <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="zipCode"
                        placeholder="ZIP Code"
                        value={formData.zipCode}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData("zipCode", e.target.value)}
                        className="bg-input border-border text-foreground transition-all duration-200 focus:scale-[1.02] focus:shadow-lg"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth" className="text-foreground">
                        Date of Birth <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        placeholder="Date of Birth"
                        value={formData.dateOfBirth}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData("dateOfBirth", e.target.value)}
                        className="bg-input border-border text-foreground transition-all duration-200 focus:scale-[1.02] focus:shadow-lg"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender" className="text-foreground">
                        Gender
                      </Label>
                      <Select value={formData.gender} onValueChange={(value: string) => updateFormData("gender", value)}>
                        <SelectTrigger className="bg-input border-border text-foreground transition-all duration-200 hover:scale-[1.02]">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Bank Details */}
              {currentStep === 3 && (
                <div className="space-y-4 animate-in slide-in-from-right duration-300">
                  <div className="space-y-2">
                    <Label htmlFor="bankName" className="text-foreground">
                      Bank Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="bankName"
                      placeholder="Enter your bank name"
                      value={formData.bankName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData("bankName", e.target.value)}
                      className="bg-input border-border text-foreground transition-all duration-200 focus:scale-[1.02] focus:shadow-lg"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="accountNumber" className="text-foreground">
                        Account Number <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="accountNumber"
                        placeholder="Enter account number"
                        value={formData.accountNumber}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData("accountNumber", e.target.value)}
                        className="bg-input border-border text-foreground transition-all duration-200 focus:scale-[1.02] focus:shadow-lg"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ifsc" className="text-foreground">
                        IFSC Code <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="ifsc"
                        placeholder="Enter IFSC code"
                        value={formData.ifsc}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData("ifsc", e.target.value)}
                        className="bg-input border-border text-foreground transition-all duration-200 focus:scale-[1.02] focus:shadow-lg"
                        required
                      />
                    </div>
                  </div>
                  <div className="bg-muted p-4 rounded-lg animate-in fade-in duration-500 delay-200">
                    <p className="text-sm text-muted-foreground">
                      🔒 Your banking information is encrypted and secure. We use industry-standard security measures to
                      protect your data.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 4: Terms & Agreement */}
              {currentStep === 4 && (
                <div className="space-y-6 animate-in slide-in-from-right duration-300">
                  <div className="bg-card border border-border rounded-lg p-6 max-h-64 overflow-y-auto">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Terms of Service & Privacy Policy</h3>
                    <div className="space-y-4 text-sm text-muted-foreground">
                      <p>
                        By creating an account, you agree to our Terms of Service and acknowledge that you have read our
                        Privacy Policy.
                      </p>
                      <p>
                        <strong className="text-foreground">Data Collection:</strong> We collect personal information to
                        provide and improve our services. This includes your name, email, address, banking, and wallet
                        information for account verification and transactions.
                      </p>
                      <p>
                        <strong className="text-foreground">Data Usage:</strong> Your information is used to process
                        transactions, verify your identity, and communicate important account updates.
                      </p>
                      <p>
                        <strong className="text-foreground">Data Protection:</strong> We implement industry-standard
                        security measures to protect your personal, financial, and wallet information.
                      </p>
                      <p>
                        <strong className="text-foreground">Third Parties:</strong> We do not sell your personal
                        information to third parties. We may share information with trusted partners for service
                        delivery only.
                      </p>
                    </div>
                  </div>

                  {/* MetaMask Wallet Connect */}
                  <div className="space-y-2">
                    <Label htmlFor="walletAddress" className="text-foreground">
                      MetaMask Wallet Address <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        id="walletAddress"
                        placeholder="Connect your MetaMask wallet"
                        value={formData.walletAddress}
                        readOnly
                        className="bg-input border-border text-foreground transition-all duration-200 focus:scale-[1.02] focus:shadow-lg"
                        required
                      />
                      <Button type="button" onClick={connectWallet} className="bg-primary text-primary-foreground">
                        {formData.walletAddress ? "Connected" : "Connect Wallet"}
                      </Button>
                    </div>
                    {walletError && <p className="text-red-500 text-sm mt-1">{walletError}</p>}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 transition-all duration-200 hover:bg-muted/50 p-2 rounded">
                      <Checkbox
                        id="terms"
                        checked={formData.termsAccepted}
                        onCheckedChange={(checked: boolean) => updateFormData("termsAccepted", checked)}
                        className="transition-all duration-200"
                      />
                      <Label htmlFor="terms" className="text-sm text-foreground">
                        I agree to the <span className="text-primary underline cursor-pointer">Terms of Service</span>{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 transition-all duration-200 hover:bg-muted/50 p-2 rounded">
                      <Checkbox
                        id="privacy"
                        checked={formData.privacyAccepted}
                        onCheckedChange={(checked: boolean) => updateFormData("privacyAccepted", checked)}
                        className="transition-all duration-200"
                      />
                      <Label htmlFor="privacy" className="text-sm text-foreground">
                        I acknowledge the <span className="text-primary underline cursor-pointer">Privacy Policy</span>{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 transition-all duration-200 hover:bg-muted/50 p-2 rounded">
                      <Checkbox
                        id="marketing"
                        checked={formData.marketingAccepted}
                        onCheckedChange={(checked: boolean) => updateFormData("marketingAccepted", checked)}
                        className="transition-all duration-200"
                      />
                      <Label htmlFor="marketing" className="text-sm text-foreground">
                        I agree to receive marketing communications (optional)
                      </Label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="border-border text-foreground hover:bg-muted bg-transparent transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              {currentStep < 4 ? (
                <Button
                  onClick={nextStep}
                  disabled={!validateStep(currentStep)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 hover:scale-105 disabled:hover:scale-100 disabled:opacity-50"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!validateStep(4)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 hover:scale-105 disabled:hover:scale-100 disabled:opacity-50"
                >
                  Create Account
                  <Check className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
