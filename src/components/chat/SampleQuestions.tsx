import React from 'react';
import { Button } from '@/components/ui/button';

interface SampleQuestionsProps {
  questions: string[];
  onQuestionSelect: (question: string) => void;
}

const SampleQuestions: React.FC<SampleQuestionsProps> = ({
  questions,
  onQuestionSelect
}) => {
  return (
    <div className="flex-shrink-0 mx-3 md:mx-4 mb-3 p-3 md:p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-xs md:text-sm font-medium text-gray-600 mb-2 md:mb-3">Try asking:</h3>
      <div className="grid grid-cols-1 gap-2">
        {questions.map((question, i) => (
          <Button 
            key={i} 
            variant="outline"
            size="sm"
            className="text-xs md:text-sm text-left justify-start h-auto py-2.5 px-3 bg-gray-50 hover:bg-gray-100 border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 leading-relaxed whitespace-normal rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
            onClick={() => onQuestionSelect(question)}
          >
            <span className="break-words text-left w-full">{question}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default SampleQuestions;