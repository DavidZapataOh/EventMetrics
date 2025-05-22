import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-text flex flex-col">
      <header className="p-6 border-b border-element">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="h-8 w-8 bg-primary rounded-md mr-2"></div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text">
              EventMetrics
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link href="/login" className="text-textSecondary hover:text-text">
              Login
            </Link>
            <Link href="/register" className="inline-block">
              <Button variant="primary">Register</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                Analyze the impact of your events <span className="bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text">blockchain</span>
              </h1>
              <p className="mt-6 text-lg text-textSecondary max-w-2xl mx-auto">
                The platform designed for event planners who want to measure, analyze and improve their in-person, virtual and hybrid events.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register" className="inline-block">
                  <Button variant="primary" size="lg">Start now</Button>
                </Link>
                <Link href="/dashboard" className="inline-block">
                  <Button 
                    variant="primary" 
                    size="lg" 
                    className="bg-element hover:bg-card"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    See demo
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-16 bg-card">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold">Everything you need to manage your events</h2>
              <p className="mt-4 text-textSecondary max-w-2xl mx-auto">
                From event creation to detailed metric analysis, EventMetrics helps you maximize the impact of your events.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="bg-element">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <CardTitle>Event management</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Create, edit and manage your in-person, virtual or hybrid events in one platform.
                  </CardDescription>
                </CardContent>
              </Card>
              
              <Card className="bg-element">
                <CardHeader>
                  <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-secondary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <CardTitle>Detailed analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Visualize all key metrics to measure the success of your events and the effectiveness of your event planners.
                  </CardDescription>
                </CardContent>
              </Card>
              
              <Card className="bg-element">
                <CardHeader>
                  <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <CardTitle>Wallet tracking</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Monitor the creation of new wallets, transactions during and after events.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        
        <section className="py-16">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="md:w-1/2">
                <p className="text-textSecondary mb-4">
                  EventMetrics was created specifically to help event planners measure the real impact of their outreach activities.
                </p>
                <p className="text-textSecondary mb-6">
                  With this platform you can:
                </p>
                <ul className="space-y-4">
                  {[
                    "Identify which people achieve the best results",
                    "Compare the efficiency of different types of events",
                    "Analyze the cost per created wallet to optimize budgets",
                    "Measure the long-term commitment of event attendees"
                  ].map((item, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="w-5 h-5 text-primary mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Card className="md:w-1/2 h-96">
                <CardContent className="h-full flex items-center justify-center">
                  <p className="text-textSecondary text-center">
                    [Image of the application interface]
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-card border-t border-element py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="h-8 w-8 bg-primary rounded-md mr-2"></div>
              <span className="font-bold">EventMetrics</span>
            </div>
            <div className="text-sm text-textSecondary">
              © {new Date().getFullYear()} EventMetrics. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}