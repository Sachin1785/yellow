"use client"

import { useState } from "react"
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
  name: string
  email: string
  password: string
  confirmPassword: string

  // Step 2: Personal Details
  address: string
  city: string
  state: string
  zipCode: string
  phone: string
  age: string
  gender: string

  // Step 3: Bank Details
  bankName: string
  accountNumber: string
  routingNumber: string
  accountType: string

  // Step 4: Agreement
  termsAccepted: boolean
  privacyAccepted: boolean
  marketingAccepted: boolean
}

const steps = [
  { id: 1, title: "Basic Information", icon: User, description: "Enter your basic details" },
  { id: 2, title: "Personal Details", icon: MapPin, description: "Complete your profile" },
  { id: 3, title: "Bank Information", icon: CreditCard, description: "Add your banking details" },
  { id: 4, title: "Terms & Agreement", icon: FileText, description: "Review and accept terms" },
]

export default function SignupPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    age: "",
    gender: "",
    bankName: "",
    accountNumber: "",
    routingNumber: "",
    accountType: "",
    termsAccepted: false,
    privacyAccepted: false,
    marketingAccepted: false,
  })

  const updateFormData = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.name && formData.email && formData.password && formData.confirmPassword)
      case 2:
        return !!(formData.address && formData.city && formData.state && formData.zipCode && formData.phone)
      case 3:
        return !!(formData.bankName && formData.accountNumber && formData.routingNumber && formData.accountType)
      case 4:
        return formData.termsAccepted && formData.privacyAccepted
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
      console.log("Form submitted:", formData)
      // Handle form submission here
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
                      <Label htmlFor="name" className="text-foreground">
                        Full Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData("name", e.target.value)}
                        className="bg-input border-border text-foreground transition-all duration-200 focus:scale-[1.02] focus:shadow-lg"
                        required
                      />
                    </div>
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
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-foreground">
                        Password <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Create a password"
                        value={formData.password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData("password", e.target.value)}
                        className="bg-input border-border text-foreground transition-all duration-200 focus:scale-[1.02] focus:shadow-lg"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-foreground">
                        Confirm Password <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData("confirmPassword", e.target.value)}
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
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-foreground">
                      Street Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="address"
                      placeholder="Enter your street address"
                      value={formData.address}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData("address", e.target.value)}
                      className="bg-input border-border text-foreground transition-all duration-200 focus:scale-[1.02] focus:shadow-lg"
                      required
                    />
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
                    <div className="space-y-2">
                      <Label htmlFor="age" className="text-foreground">
                        Age
                      </Label>
                      <Input
                        id="age"
                        type="number"
                        placeholder="Age"
                        value={formData.age}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData("age", e.target.value)}
                        className="bg-input border-border text-foreground transition-all duration-200 focus:scale-[1.02] focus:shadow-lg"
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
                      <Label htmlFor="routingNumber" className="text-foreground">
                        Routing Number <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="routingNumber"
                        placeholder="Enter routing number"
                        value={formData.routingNumber}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData("routingNumber", e.target.value)}
                        className="bg-input border-border text-foreground transition-all duration-200 focus:scale-[1.02] focus:shadow-lg"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountType" className="text-foreground">
                      Account Type <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.accountType}
                      onValueChange={(value: string) => updateFormData("accountType", value)}
                    >
                      <SelectTrigger className="bg-input border-border text-foreground transition-all duration-200 hover:scale-[1.02]">
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="checking">Checking</SelectItem>
                        <SelectItem value="savings">Savings</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                      </SelectContent>
                    </Select>
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
                        provide and improve our services. This includes your name, email, address, and banking
                        information for account verification and transactions.
                      </p>
                      <p>
                        <strong className="text-foreground">Data Usage:</strong> Your information is used to process
                        transactions, verify your identity, and communicate important account updates.
                      </p>
                      <p>
                        <strong className="text-foreground">Data Protection:</strong> We implement industry-standard
                        security measures to protect your personal and financial information.
                      </p>
                      <p>
                        <strong className="text-foreground">Third Parties:</strong> We do not sell your personal
                        information to third parties. We may share information with trusted partners for service
                        delivery only.
                      </p>
                    </div>
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

        {/* Footer */}
        <div className="text-center mt-8 animate-in fade-in duration-500 delay-300">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <span className="text-primary underline cursor-pointer hover:text-primary/80 transition-colors duration-200">
              Sign in here
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
