import type React from "react"
import Hero from "@/components/Hero"
import FeaturedProducts from "@/components/FeaturedProducts"
import Testimonials from "@/components/Testimonials"
import NewsletterSignup from "@/components/NewsletterSignup"
import Footer from "@/components/Footer"

const ClientPage: React.FC = () => {
  return (
    <div>
      <Hero />
      <FeaturedProducts />
      <Testimonials />
      <NewsletterSignup />
      <Footer />
    </div>
  )
}

export default ClientPage
