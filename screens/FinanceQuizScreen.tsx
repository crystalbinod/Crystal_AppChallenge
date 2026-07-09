import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  pickQuizRound,
  QUESTIONS_PER_ROUND,
  type FinancialQuizQuestion,
} from '../lib/financialQuiz';

function formatTime(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function FinanceQuizScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isPortrait = height > width;

  const [questions, setQuestions] = useState<FinancialQuizQuestion[]>(() => pickQuizRound());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [roundComplete, setRoundComplete] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [swRunning, setSwRunning] = useState(false);

  const current = questions[currentIndex];

  useEffect(() => {
    let unsub: (() => void) | null = null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const sw = require('../lib/stopwatch_parttime').default;
      unsub = sw.subscribe((ms: number, running: boolean) => {
        setElapsedMs(ms);
        setSwRunning(running);
      });
    } catch {
      // ignore
    }
    return () => {
      if (unsub) unsub();
    };
  }, []);

  const startNewRound = () => {
    setQuestions(pickQuizRound());
    setCurrentIndex(0);
    setSelectedIndex(null);
    setCorrectCount(0);
    setRoundComplete(false);
  };

  const onSelect = (index: number) => {
    if (selectedIndex !== null || !current) return;
    setSelectedIndex(index);
    if (index === current.correctIndex) {
      setCorrectCount((c) => c + 1);
    }
  };

  const onNext = () => {
    if (currentIndex + 1 >= questions.length) {
      setRoundComplete(true);
      return;
    }
    setCurrentIndex((i) => i + 1);
    setSelectedIndex(null);
  };

  const contentMaxWidth = isPortrait ? Math.min(width - 32, 480) : Math.min(width - 160, 560);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: 16,
        alignItems: 'center',
      }}
    >
      <View style={[styles.card, { width: contentMaxWidth, maxWidth: '100%' }]}>
        <Text style={styles.title}>Finance Quiz</Text>
        <Text style={styles.session}>
          Session: {formatTime(elapsedMs)} {swRunning ? '' : '(paused)'}
        </Text>

        {roundComplete ? (
          <View style={styles.completeBox}>
            <Text style={styles.completeTitle}>Round complete!</Text>
            <Text style={styles.completeScore}>
              {correctCount} / {questions.length} correct
            </Text>
            <Text style={styles.hint}>
              Pay still comes from work time — start another round or head back when you hit 3+ minutes.
            </Text>
            <TouchableOpacity style={styles.button} onPress={startNewRound}>
              <Text style={styles.buttonText}>New Round</Text>
            </TouchableOpacity>
          </View>
        ) : current ? (
          <>
            <Text style={styles.progress}>
              Question {currentIndex + 1} of {questions.length}
            </Text>
            <Text style={styles.prompt}>{current.prompt}</Text>

            {current.choices.map((choice, index) => {
              const answered = selectedIndex !== null;
              const isSelected = selectedIndex === index;
              const isCorrect = index === current.correctIndex;
              let bg = '#eef2ff';
              if (answered && isCorrect) bg = '#bbf7d0';
              else if (answered && isSelected && !isCorrect) bg = '#fecaca';
              else if (answered && !isSelected) bg = '#f3f4f6';

              return (
                <TouchableOpacity
                  key={`${current.id}-${index}`}
                  style={[styles.choice, { backgroundColor: bg }]}
                  onPress={() => onSelect(index)}
                  disabled={answered}
                  activeOpacity={0.85}
                >
                  <Text style={styles.choiceText}>{choice}</Text>
                </TouchableOpacity>
              );
            })}

            {selectedIndex !== null && (
              <View style={styles.feedbackBox}>
                <Text style={styles.feedbackLabel}>
                  {selectedIndex === current.correctIndex ? 'Correct!' : 'Not quite.'}
                </Text>
                <Text style={styles.feedbackText}>{current.explanation}</Text>
                <TouchableOpacity style={styles.button} onPress={onNext}>
                  <Text style={styles.buttonText}>
                    {currentIndex + 1 >= questions.length ? 'See Results' : 'Next Question'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : null}

        {!roundComplete && (
          <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={startNewRound}>
            <Text style={styles.buttonText}>Shuffle New Round</Text>
          </TouchableOpacity>
        )}
      </View>

      {!isPortrait && (
        <View style={[styles.sidePanel, { width: 120 }]}>
          <Text style={styles.sideLabel}>Score</Text>
          <Text style={styles.sideValue}>
            {correctCount}/{QUESTIONS_PER_ROUND}
          </Text>
          <Text style={styles.hint}>Random questions each round.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e6edf3',
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#63372C',
    textAlign: 'center',
    marginBottom: 4,
  },
  session: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  progress: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
  },
  prompt: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 24,
    marginBottom: 16,
  },
  choice: {
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  choiceText: {
    fontSize: 15,
    color: '#1f2937',
    lineHeight: 21,
  },
  feedbackBox: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#fffbeb',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  feedbackLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#63372C',
    marginBottom: 6,
  },
  feedbackText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  completeBox: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  completeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#63372C',
    marginBottom: 8,
  },
  completeScore: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#8f5a3b',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  secondaryButton: {
    marginTop: 16,
    backgroundColor: '#63372C',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  hint: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
  },
  sidePanel: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e6edf3',
    alignItems: 'center',
  },
  sideLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  sideValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginVertical: 6,
  },
});
