import { Button } from "./ui/button"
import { Twitter, Github, Linkedin, MessageCircle } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">CT</span>
              </div>
              <span className="font-bold text-xl">CryptoTrade</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Professional cryptocurrency trading platform trusted by millions worldwide.
            </p>
            <div className="flex gap-4">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                <Github className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                <Linkedin className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                <MessageCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Products</h3>
            <div className="space-y-2 text-sm">
              <div>
                <Button variant="ghost" className="h-auto p-0 text-muted-foreground hover:text-primary">
                  Spot Trading
                </Button>
              </div>
              <div>
                <Button variant="ghost" className="h-auto p-0 text-muted-foreground hover:text-primary">
                  Futures
                </Button>
              </div>
              <div>
                <Button variant="ghost" className="h-auto p-0 text-muted-foreground hover:text-primary">
                  Options
                </Button>
              </div>
              <div>
                <Button variant="ghost" className="h-auto p-0 text-muted-foreground hover:text-primary">
                  Staking
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Support</h3>
            <div className="space-y-2 text-sm">
              <div>
                <Button variant="ghost" className="h-auto p-0 text-muted-foreground hover:text-primary">
                  Help Center
                </Button>
              </div>
              <div>
                <Button variant="ghost" className="h-auto p-0 text-muted-foreground hover:text-primary">
                  API Documentation
                </Button>
              </div>
              <div>
                <Button variant="ghost" className="h-auto p-0 text-muted-foreground hover:text-primary">
                  Trading Fees
                </Button>
              </div>
              <div>
                <Button variant="ghost" className="h-auto p-0 text-muted-foreground hover:text-primary">
                  Contact Us
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Company</h3>
            <div className="space-y-2 text-sm">
              <div>
                <Button variant="ghost" className="h-auto p-0 text-muted-foreground hover:text-primary">
                  About Us
                </Button>
              </div>
              <div>
                <Button variant="ghost" className="h-auto p-0 text-muted-foreground hover:text-primary">
                  Careers
                </Button>
              </div>
              <div>
                <Button variant="ghost" className="h-auto p-0 text-muted-foreground hover:text-primary">
                  Security
                </Button>
              </div>
              <div>
                <Button variant="ghost" className="h-auto p-0 text-muted-foreground hover:text-primary">
                  Privacy Policy
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">© 2024 CryptoTrade Pro. All rights reserved.</p>
          <div className="flex gap-6 text-sm">
            <Button variant="ghost" className="h-auto p-0 text-muted-foreground hover:text-primary">
              Terms
            </Button>
            <Button variant="ghost" className="h-auto p-0 text-muted-foreground hover:text-primary">
              Privacy
            </Button>
            <Button variant="ghost" className="h-auto p-0 text-muted-foreground hover:text-primary">
              Cookies
            </Button>
          </div>
        </div>
      </div>
    </footer>
  )
}
