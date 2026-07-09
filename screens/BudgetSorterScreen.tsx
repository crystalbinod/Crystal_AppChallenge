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
  pickBudgetRound,
  ITEMS_PER_ROUND,
  categoryLabel,
  type BudgetCategory,
  type BudgetItem,
} from '../lib/budgetSorter';

function formatTime(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function BudgetSorterScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [items, setItems] = useState<BudgetItem[]>(() => pickBudgetRound());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [lastFeedback, setLastFeedback] = useState<{ correct: boolean; hint: string } | null>(null);
  const [roundComplete, setRoundComplete] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [swRunning, setSwRunning] = useState(false);

  const current = items[currentIndex];
  const contentMaxWidth = Math.min(width - 32, 480);

  useEffect(() => {
    let unsub: (() => void) | null = null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const sw = require('../lib/stopwatch_freelance').default;
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
    setItems(pickBudgetRound());
    setCurrentIndex(0);
    setCorrectCount(0);
    setLastFeedback(null);
    setRoundComplete(false);
  };

  const onSort = (choice: BudgetCategory) => {
    if (!current || lastFeedback !== null) return;
    const correct = choice === current.category;
    if (correct) setCorrectCount((c) => c + 1);
    setLastFeedback({ correct, hint: current.hint });
  };

  const onNext = () => {
    if (currentIndex + 1 >= items.length) {
      setRoundComplete(true);
      setLastFeedback(null);
      return;
    }
    setCurrentIndex((i) => i + 1);
    setLastFeedback(null);
  };

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
        <Text style={styles.title}>Budget Sorter</Text>
        <Text style={styles.subtitle}>Is it a Need or a Want?</Text>
        <Text style={styles.session}>
          Session: {formatTime(elapsedMs)} {swRunning ? '' : '(paused)'}
        </Text>

        {roundComplete ? (
          <View style={styles.completeBox}>
            <Text style={styles.completeTitle}>Round complete!</Text>
            <Text style={styles.completeScore}>
              {correctCount} / {items.length} sorted correctly
            </Text>
            <Text style={styles.hint}>
              Freelance pay still comes from work time — aim for at least 1 minute, then press Next Day on Home.
            </Text>
            <TouchableOpacity style={styles.button} onPress={startNewRound}>
              <Text style={styles.buttonText}>New Round</Text>
            </TouchableOpacity>
          </View>
        ) : current ? (
          <>
            <Text style={styles.progress}>
              Item {currentIndex + 1} of {items.length}
            </Text>

            <View style={styles.itemCard}>
              <Text style={styles.itemLabel}>{current.label}</Text>
              {current.amount != null && (
                <Text style={styles.itemAmount}>~${current.amount}</Text>
              )}
            </View>

            {lastFeedback === null ? (
              <View style={styles.sortRow}>
                <TouchableOpacity
                  style={[styles.sortButton, styles.needButton]}
                  onPress={() => onSort('need')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.sortButtonText}>Need</Text>
                  <Text style={styles.sortHint}>Must-have / bill</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sortButton, styles.wantButton]}
                  onPress={() => onSort('want')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.sortButtonText}>Want</Text>
                  <Text style={styles.sortHint}>Nice to have</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View
                style={[
                  styles.feedbackBox,
                  lastFeedback.correct ? styles.feedbackCorrect : styles.feedbackWrong,
                ]}
              >
                <Text style={styles.feedbackLabel}>
                  {lastFeedback.correct
                    ? `Correct — it's a ${categoryLabel(current.category)}!`
                    : `It's a ${categoryLabel(current.category)}, not a ${categoryLabel(current.category === 'need' ? 'want' : 'need')}.`}
                </Text>
                <Text style={styles.feedbackText}>{lastFeedback.hint}</Text>
                <TouchableOpacity style={styles.button} onPress={onNext}>
                  <Text style={styles.buttonText}>
                    {currentIndex + 1 >= items.length ? 'See Results' : 'Next Item'}
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

      <Text style={styles.footerHint}>
        {ITEMS_PER_ROUND} random items each round — needs before wants when money is tight.
      </Text>
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
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 8,
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
    marginBottom: 10,
  },
  itemCard: {
    backgroundColor: '#eef2ff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  itemLabel: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 28,
  },
  itemAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#63372C',
    marginTop: 8,
  },
  sortRow: {
    flexDirection: 'row',
    gap: 12,
  },
  sortButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 2,
  },
  needButton: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
  },
  wantButton: {
    backgroundColor: '#fce7f3',
    borderColor: '#f9a8d4',
  },
  sortButtonText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  sortHint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  feedbackBox: {
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
  },
  feedbackCorrect: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  feedbackWrong: {
    backgroundColor: '#fffbeb',
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
  footerHint: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 8,
    lineHeight: 18,
  },
});
