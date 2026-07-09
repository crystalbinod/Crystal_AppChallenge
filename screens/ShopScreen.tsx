// screens/ShopScreen.tsx
import * as React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Pressable,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
  ImageSourcePropType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, db } from '../lib/firebase';
import { doc, onSnapshot, runTransaction } from 'firebase/firestore';
import { useFonts } from 'expo-font';

type ShopItem = {
  name: string;
  price: number;
  image: ImageSourcePropType;
  imageStyle: { width: number; height: number; marginTop?: number };
  allowQuantity: boolean;
};

const SHOP_ITEMS: ShopItem[] = [
  {
    name: 'Food',
    price: 2,
    image: require('../assets/pastry.png'),
    imageStyle: { width: 90, height: 70, marginTop: 8 },
    allowQuantity: true,
  },
  {
    name: 'House',
    price: 50000,
    image: require('../assets/house2.png'),
    imageStyle: { width: 80, height: 80, marginTop: 4 },
    allowQuantity: false,
  },
  {
    name: 'Utilities',
    price: 2,
    image: require('../assets/utilities.png'),
    imageStyle: { width: 90, height: 70, marginTop: 8 },
    allowQuantity: true,
  },
  {
    name: 'Car',
    price: 50000,
    image: require('../assets/car.png'),
    imageStyle: { width: 100, height: 50, marginTop: 16 },
    allowQuantity: false,
  },
];

function formatPrice(price: number) {
  return price >= 1000 ? `$${price.toLocaleString()}` : `$${price}`;
}

export default function ShopScreen() {
  const [fontsLoaded] = useFonts({
    'LazyDaze': require('../assets/ATP-Lazy Daze.ttf'),
    'Windows': require('../assets/windows-bold.ttf'),
    'RetroBoulevard': require('../assets/Retro Boulevard.ttf'),
    'Pixel': require('../assets/pixel.ttf'),
  });

  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isPortrait = height > width;
  const horizontalPad = 16;
  const gap = 12;
  const cardWidth = isPortrait
    ? (width - horizontalPad * 2 - gap) / 2
    : Math.min(180, (width - horizontalPad * 2 - gap * 3) / 4);

  const [loadingUser, setLoadingUser] = React.useState(true);
  const [userData, setUserData] = React.useState<any>({});
  const [checkingAccounts, setCheckingAccounts] = React.useState<Record<string, number>>({});
  const [creditCards, setCreditCards] = React.useState<Record<string, number>>({});
  const [walletVisible, setWalletVisible] = React.useState(false);
  const [walletItem, setWalletItem] = React.useState<ShopItem | null>(null);
  const [quantity, setQuantity] = React.useState(1);
  const [paymentMethod, setPaymentMethod] = React.useState<'debit' | 'credit'>('debit');
  const [selectedChecking, setSelectedChecking] = React.useState<string | null>(null);
  const [selectedCard, setSelectedCard] = React.useState<string | null>(null);
  const [processing, setProcessing] = React.useState(false);

  React.useEffect(() => {
    const u = auth.currentUser;
    if (!u) {
      setLoadingUser(false);
      return;
    }
    const ref = doc(db, 'users', u.uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setUserData({});
          setCheckingAccounts({});
          setCreditCards({});
          setLoadingUser(false);
          return;
        }
        const data = snap.data() as any;
        setUserData(data);
        const liquid = data.liquidMoney ?? {};
        const checking =
          liquid.checkingAccount && typeof liquid.checkingAccount === 'object'
            ? liquid.checkingAccount
            : {};
        const parsedChecking: Record<string, number> = {};
        for (const [k, v] of Object.entries(checking)) parsedChecking[k] = Number(v) || 0;
        setCheckingAccounts(parsedChecking);

        const credit = data.credit ?? {};
        const cards =
          credit.creditCards && typeof credit.creditCards === 'object'
            ? credit.creditCards
            : {};
        const parsedCards: Record<string, number> = {};
        for (const [k, v] of Object.entries(cards)) parsedCards[k] = Number(v) || 0;
        setCreditCards(parsedCards);

        setLoadingUser(false);
      },
      (e) => {
        console.error('user onSnapshot', e);
        setLoadingUser(false);
      },
    );
    return () => unsub();
  }, []);

  const openWallet = (item: ShopItem) => {
    setWalletItem(item);
    setQuantity(1);
    setPaymentMethod('debit');
    setSelectedChecking(Object.keys(checkingAccounts)[0] ?? null);
    setSelectedCard(Object.keys(creditCards)[0] ?? null);
    setWalletVisible(true);
  };

  const adjustQuantity = (delta: number) => {
    if (!walletItem?.allowQuantity) return;
    setQuantity((prev) => Math.max(1, Math.min(99, prev + delta)));
  };

  const getPurchaseQuantity = () => {
    if (!walletItem) return 1;
    return walletItem.allowQuantity ? quantity : 1;
  };

  const getTotalPrice = () => {
    if (!walletItem) return 0;
    return walletItem.price * getPurchaseQuantity();
  };

  const handlePurchase = async () => {
    if (!walletItem) return;
    const qty = getPurchaseQuantity();
    const totalPrice = getTotalPrice();
    const u = auth.currentUser;
    if (!u) return Alert.alert('Not signed in');
    const userRef = doc(db, 'users', u.uid);
    setProcessing(true);
    try {
      if (paymentMethod === 'debit') {
        if (!selectedChecking) {
          Alert.alert('Choose account', 'Please select a checking account.');
          setProcessing(false);
          return;
        }
        await runTransaction(db, async (tx) => {
          const snap = await tx.get(userRef);
          if (!snap.exists()) throw new Error('User doc missing');
          const data = snap.data() as any;
          const liquid = data.liquidMoney ?? {};
          const prevTotal = Number(liquid.total) || 0;
          const checkingMap =
            liquid.checkingAccount && typeof liquid.checkingAccount === 'object'
              ? liquid.checkingAccount
              : {};
          const prevChecking = Number(checkingMap[selectedChecking!]) || 0;
          if (prevTotal < totalPrice) throw new Error('Insufficient total funds');
          if (prevChecking < totalPrice) {
            throw new Error('Insufficient funds in selected checking account');
          }
          const updates: any = {};
          updates['liquidMoney.total'] = prevTotal - totalPrice;
          updates['liquidMoney.checkingAccount.' + selectedChecking] = prevChecking - totalPrice;

          if (walletItem.name === 'Food') {
            updates.food = (Number(data.food) || 0) + qty;
          } else if (walletItem.name === 'Utilities') {
            updates.utilities = (Number(data.utilities) || 0) + qty;
          } else if (walletItem.name === 'House') {
            updates.housing = 'house';
          } else if (walletItem.name === 'Car') {
            updates.car = true;
          }

          tx.update(userRef, updates);
        });
        Alert.alert(
          'Purchased',
          `${qty}x ${walletItem.name} purchased for $${totalPrice.toLocaleString()} from checking.`,
        );
      } else {
        await runTransaction(db, async (tx) => {
          const snap = await tx.get(userRef);
          if (!snap.exists()) throw new Error('User doc missing');
          const data = snap.data() as any;
          const credit = data.credit ?? {};
          const prevBill = Number(credit.creditCardbill) || 0;
          const updates: any = {};
          updates['credit.creditCardbill'] = prevBill + totalPrice;

          if (walletItem.name === 'Food') {
            updates.food = (Number(data.food) || 0) + qty;
          } else if (walletItem.name === 'Utilities') {
            updates.utilities = (Number(data.utilities) || 0) + qty;
          } else if (walletItem.name === 'House') {
            updates.housing = 'house';
          } else if (walletItem.name === 'Car') {
            updates.car = true;
          }

          tx.update(userRef, updates);
        });
        Alert.alert(
          'Purchased',
          `${qty}x ${walletItem.name} purchased for $${totalPrice.toLocaleString()} on credit.`,
        );
      }
      setWalletVisible(false);
    } catch (e: any) {
      console.error('purchase error', e);
      Alert.alert('Purchase failed', e.message || String(e));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: horizontalPad,
        }}
      >
        <Text style={styles.title}>Shop</Text>

        <View style={[styles.grid, { gap }]}>
          {SHOP_ITEMS.map((item) => (
            <View key={item.name} style={[styles.card, { width: cardWidth }]}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Image
                source={item.image}
                style={[styles.cardImage, item.imageStyle]}
                resizeMode="contain"
              />
              <Text style={styles.price}>{formatPrice(item.price)}</Text>
              <TouchableOpacity
                onPress={() => openWallet(item)}
                activeOpacity={0.7}
                style={styles.buyBtn}
              >
                <Text style={styles.buyBtnText}>Buy</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={walletVisible}
        animationType="slide"
        transparent
        onRequestClose={() => {
          if (!processing) setWalletVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {walletItem ? (
              <>
                <Text style={styles.modalTitle}>{walletItem.name}</Text>
                <Text style={styles.modalLine}>
                  Unit price: ${walletItem.price.toLocaleString()}
                </Text>

                {walletItem.allowQuantity ? (
                  <View style={styles.qtyRow}>
                    <Text style={styles.modalLabel}>Quantity</Text>
                    <View style={styles.qtyControls}>
                      <Pressable
                        onPress={() => adjustQuantity(-1)}
                        style={styles.qtyBtn}
                        disabled={quantity <= 1}
                      >
                        <Text style={styles.qtyBtnText}>−</Text>
                      </Pressable>
                      <Text style={styles.qtyValue}>{quantity}</Text>
                      <Pressable
                        onPress={() => adjustQuantity(1)}
                        style={styles.qtyBtn}
                        disabled={quantity >= 99}
                      >
                        <Text style={styles.qtyBtnText}>+</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : null}

                <Text style={styles.modalTotal}>
                  Total: ${getTotalPrice().toLocaleString()}
                </Text>

                <Text style={styles.modalLabel}>Payment method</Text>
                <View style={styles.payRow}>
                  <TouchableOpacity onPress={() => setPaymentMethod('debit')}>
                    <Text
                      style={[
                        styles.payOption,
                        paymentMethod === 'debit' && styles.payOptionActive,
                      ]}
                    >
                      Debit (Checking)
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setPaymentMethod('credit')}>
                    <Text
                      style={[
                        styles.payOption,
                        paymentMethod === 'credit' && styles.payOptionActive,
                      ]}
                    >
                      Credit
                    </Text>
                  </TouchableOpacity>
                </View>

                {paymentMethod === 'debit' ? (
                  <>
                    <Text style={styles.modalLabel}>Choose checking account</Text>
                    {Object.entries(checkingAccounts).length === 0 && (
                      <Text style={styles.modalLine}>No checking accounts</Text>
                    )}
                    {Object.entries(checkingAccounts).map(([k, v]) => (
                      <TouchableOpacity
                        key={k}
                        onPress={() => setSelectedChecking(k)}
                        style={styles.accountRow}
                      >
                        <Text
                          style={[
                            styles.modalLine,
                            selectedChecking === k && styles.selectedLine,
                          ]}
                        >
                          {k}
                        </Text>
                        <Text style={styles.modalLine}>${v}</Text>
                      </TouchableOpacity>
                    ))}
                  </>
                ) : (
                  <>
                    <Text style={styles.modalLabel}>Choose credit card</Text>
                    {Object.entries(creditCards).length === 0 && (
                      <Text style={styles.modalLine}>No credit cards</Text>
                    )}
                    {Object.entries(creditCards).map(([k, v]) => (
                      <TouchableOpacity
                        key={k}
                        onPress={() => setSelectedCard(k)}
                        style={styles.accountRow}
                      >
                        <Text
                          style={[
                            styles.modalLine,
                            selectedCard === k && styles.selectedLine,
                          ]}
                        >
                          {k}
                        </Text>
                        <Text style={styles.modalLine}>Limit: ${v}</Text>
                      </TouchableOpacity>
                    ))}
                  </>
                )}

                <View style={styles.modalActions}>
                  <Pressable
                    onPress={() => {
                      if (!processing) setWalletVisible(false);
                    }}
                    style={[styles.actionBtn, styles.cancelBtn]}
                  >
                    <Text style={styles.actionBtnText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={handlePurchase}
                    style={[styles.actionBtn, styles.confirmBtn]}
                  >
                    {processing ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.actionBtnText}>Confirm purchase</Text>
                    )}
                  </Pressable>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2E5D7',
  },
  title: {
    fontSize: 32,
    color: '#C97D60',
    fontFamily: 'Windows',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: '#c78e71ff',
    borderRadius: 20,
    borderWidth: 5,
    borderColor: '#63372C',
    paddingBottom: 12,
    marginBottom: 12,
    alignItems: 'center',
    minHeight: 220,
  },
  cardTitle: {
    backgroundColor: '#63372C',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    fontFamily: 'Pixel',
    fontSize: 16,
    color: '#fff8f3',
    borderWidth: 3,
    borderColor: '#000',
    overflow: 'hidden',
  },
  cardImage: {
    alignSelf: 'center',
  },
  price: {
    fontFamily: 'Pixel',
    fontSize: 16,
    color: '#63372C',
    marginTop: 8,
    marginBottom: 8,
  },
  buyBtn: {
    backgroundColor: '#63372C',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#000',
  },
  buyBtnText: {
    fontFamily: 'Pixel',
    fontSize: 14,
    color: '#fff8f3',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    backgroundColor: '#fff8f3',
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  modalTitle: {
    fontFamily: 'Windows',
    fontSize: 22,
    color: '#63372C',
  },
  modalLine: {
    fontFamily: 'LazyDaze',
    fontSize: 15,
    color: '#3d2a22',
    marginTop: 4,
  },
  modalLabel: {
    fontFamily: 'Windows',
    fontSize: 16,
    color: '#63372C',
    marginTop: 12,
    marginBottom: 6,
  },
  modalTotal: {
    fontFamily: 'Windows',
    fontSize: 18,
    color: '#63372C',
    marginTop: 10,
  },
  qtyRow: {
    marginTop: 10,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  qtyBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#63372C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    color: '#fff',
    fontSize: 22,
    fontFamily: 'Pixel',
    lineHeight: 24,
  },
  qtyValue: {
    minWidth: 48,
    textAlign: 'center',
    fontFamily: 'Pixel',
    fontSize: 18,
    color: '#63372C',
    marginHorizontal: 12,
  },
  payRow: {
    flexDirection: 'row',
    gap: 16,
  },
  payOption: {
    fontFamily: 'Pixel',
    color: '#999',
    fontSize: 14,
  },
  payOptionActive: {
    color: '#63372C',
    fontWeight: '700',
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  selectedLine: {
    color: '#63372C',
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#777',
  },
  confirmBtn: {
    backgroundColor: '#C97D60',
  },
  actionBtnText: {
    color: '#fff',
    fontFamily: 'Pixel',
  },
});
