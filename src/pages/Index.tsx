
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Database, BarChart3, TimerReset, Layers, ShieldAlert, Scale, FileJson, Globe, Workflow, Search, ArrowRight, KeyRound, Sparkles } from 'lucide-react';
import { useApiKey } from '@/contexts/ApiKeyContext';
import ApiKeyDialog from '@/components/ApiKeyDialog';
import ModelSelector from '@/components/ModelSelector';

const container = {
  hidden: {
    opacity: 0
  },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const item = {
  hidden: {
    opacity: 0,
    y: 20
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'tween',
      ease: 'easeOut',
      duration: 0.4
    }
  }
};

const features = [{
  title: 'Synthetic Data',
  description: 'Generate realistic synthetic data for testing and development',
  icon: <Layers className="h-5 w-5" />,
  path: '/synthetic-data'
}, {
  title: 'Data Augmentation',
  description: 'Enrich and expand your existing datasets',
  icon: <BarChart3 className="h-5 w-5" />,
  path: '/data-augmentation'
}, {
  title: 'Time Series Data',
  description: 'Generate time-based data with customizable patterns',
  icon: <TimerReset className="h-5 w-5" />,
  path: '/time-series'
}, {
  title: 'Edge Cases',
  description: 'Identify and generate edge cases to improve model robustness',
  icon: <Scale className="h-5 w-5" />,
  path: '/edge-cases'
}, {
  title: 'PII Handling',
  description: 'Securely process and anonymize sensitive personal data',
  icon: <ShieldAlert className="h-5 w-5" />,
  path: '/pii-handling'
}, {
  title: 'Imbalanced Data',
  description: 'Balance and optimize unevenly distributed datasets',
  icon: <Scale className="h-5 w-5" />,
  path: '/imbalanced-data'
}, {
  title: 'Data Parsing',
  description: 'Parse and structure raw data into usable formats',
  icon: <FileJson className="h-5 w-5" />,
  path: '/data-parsing'
}, {
  title: 'Data Extraction',
  description: 'Extract structured data from web scrapes and images',
  icon: <Globe className="h-5 w-5" />,
  path: '/extraction'
}, {
  title: 'Entity Recognition',
  description: 'Identify and extract named entities from text data',
  icon: <Workflow className="h-5 w-5" />,
  path: '/entity-recognition'
}, {
  title: 'Data Query & Analysis',
  description: 'Query, analyze and optimize your data operations',
  icon: <Search className="h-5 w-5" />,
  path: '/data-query'
}];

const FeatureCard = ({
  feature
}: {
  feature: typeof features[0];
}) => <motion.div variants={item}>
    <Card className="h-full overflow-hidden border border-border/40 hover:border-border/80 transition-all">
      <CardHeader className="pb-2">
        <div className="bg-primary/10 rounded-full w-10 h-10 flex items-center justify-center text-primary mb-3">
          {feature.icon}
        </div>
        <CardTitle className="text-xl">{feature.title}</CardTitle>
        <CardDescription>{feature.description}</CardDescription>
      </CardHeader>
      <CardFooter className="pt-2">
        <Link to={feature.path} className="w-full">
          <Button variant="ghost" className="flex items-center justify-between w-full bg-secondary/50 hover:bg-secondary">
            <span>Explore</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  </motion.div>;

const Index: React.FC = () => {
  const {
    isKeySet
  } = useApiKey();
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);

  return <div className="container px-4 mx-auto py-8 max-w-7xl">
      <div className="flex flex-col items-center text-center mb-16 space-y-3">
        <motion.div initial={{
        opacity: 0,
        y: -20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.5
      }} className="bg-primary/10 text-primary font-medium rounded-full px-4 py-2 text-sm">
          Data Engineering Reimagined
        </motion.div>
        
        <motion.h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight max-w-3xl" initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.5,
        delay: 0.1
      }}>Transform your data with Generative AI</motion.h1>
        
        <motion.p className="text-muted-foreground max-w-2xl text-lg" initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.5,
        delay: 0.2
      }}>DeGen.AI provides powerful tools for data engineers to generate, augment, and analyze data with state-of-the-art AI capabilities.</motion.p>
        
        <motion.div className="flex flex-wrap gap-4 justify-center mt-6" initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.5,
        delay: 0.3
      }}>
          <Button size="lg" variant="outline" className="gap-2">
            <Database className="h-4 w-4" />
            Connect Database
          </Button>
        </motion.div>
        
        {/* API Key & Model Selection Card */}
        <motion.div className="w-full max-w-md mt-6" initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.5,
        delay: 0.4
      }}>
          <Card className="border-dashed border-2 bg-background/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                AI Integration
              </CardTitle>
              <CardDescription>
                {isKeySet 
                  ? "Your OpenAI API key is set. Configure your preferred AI model below."
                  : "Set up your OpenAI API key to unlock AI-powered features across all tools."
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-0">
              {isKeySet && <ModelSelector />}
            </CardContent>
            <CardFooter className="pt-4">
              <Button onClick={() => setApiKeyDialogOpen(true)} variant={isKeySet ? "outline" : "default"} className="w-full gap-2">
                <KeyRound className="h-4 w-4" />
                {isKeySet ? "Manage API Key" : "Set Up API Key"}
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>

      <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" variants={container} initial="hidden" animate="show">
        {features.map((feature, index) => <FeatureCard key={index} feature={feature} />)}
      </motion.div>
      
      <ApiKeyDialog open={apiKeyDialogOpen} onOpenChange={setApiKeyDialogOpen} />
    </div>;
};

export default Index;
