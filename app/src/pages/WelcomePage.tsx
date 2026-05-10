import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Video, BookOpen, GraduationCap, Sparkles } from 'lucide-react';

export function WelcomePage() {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-8 mt-4">
        {/* Welcome Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-primary/10 mb-4">
            <GraduationCap className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
            Welcome to JustPastLink
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transform any educational video into perfectly structured, searchable, and interactive learning materials in minutes.
          </p>
          <div className="pt-4">
            <Button size="lg" className="px-8" onClick={() => navigate('/dashboard')}>
              Get Started with Your First Video <Sparkles className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 pt-8">
          <Card className="bg-card">
            <CardHeader>
              <Video className="h-8 w-8 text-blue-500 mb-3" />
              <CardTitle>Precise Transcripts</CardTitle>
              <CardDescription>
                We use advanced AI to accurately transcribe your videos, capturing every word without you having to type a thing.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="bg-card">
            <CardHeader>
              <BookOpen className="h-8 w-8 text-green-500 mb-3" />
              <CardTitle>Formatted Lectures</CardTitle>
              <CardDescription>
                Your raw transcript is analyzed and converted into a beautifully structured text lecture complete with headings and summaries.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-card">
            <CardHeader>
              <GraduationCap className="h-8 w-8 text-purple-500 mb-3" />
              <CardTitle>Interactive Quizzes</CardTitle>
              <CardDescription>
                Test your knowledge instantly. We auto-generate multiple-choice questions with explanations to reinforce learning.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Info Section */}
        <Card className="bg-secondary/10 border-none shadow-none mt-12">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to boost your learning?</h2>
            <p className="text-muted-foreground mb-6">
              Go to your dashboard, upload an MP4, MPEG, or WEBM video, and watch as our processing pipeline structures everything for you.
            </p>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              View Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
