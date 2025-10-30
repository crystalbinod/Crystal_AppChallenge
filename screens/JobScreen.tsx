// screens/JobScreen.tsx
import * as React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useFonts } from 'expo-font';
import { useAuthRequest } from 'expo-auth-session/providers/google';
import { collection, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';


export default function JobScreen() {
// make sure your Firestore is initialized
const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const CheckConditions = async () => {
    try {
      // Get the currently signed-in user
      
      const user = auth.currentUser;

      if (!user) {
        console.log('No user signed in');
        return false;
      }

      // Use the user's UID to fetch their Firestore document
      const docRef = doc(db, 'users', user.uid); // assumes your collection is named "users"
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const day = data.day; // make sure this field exists and is a number

        // Check the modulus condition
        if ((day-1) % 15 === 0) {
          navigation.navigate('JobGenerator');
          return true;
        } else {
          console.log('Condition not met');
        }
      } else {
        console.log('No user document found');
      }

      return false;
    } catch (error) {
      console.error('Error checking conditions:', error);
      return false;
    }
  };


    const navigateToJob = async (screen: keyof RootStackParamList) => {
    try {
      // Get the currently signed-in user
      
      const user = auth.currentUser;

      if (!user) {
        console.log('No user signed in');
        return false;
      }

      // Use the user's UID to fetch their Firestore document
      const docRef = doc(db, 'users', user.uid); // assumes your collection is named "users"
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const job = data.job; // make sure this field exists and is a number

        // Check the modulus condition
        if ( job==String(screen)) {
          navigation.navigate(screen);
          return true;
        } else {
          console.log('Condition not met');
        }
      } else {
        console.log('No user document found');
      }

      return false;
    } catch (error) {
      console.error('Error checking conditions:', error);
      return false;
    }
  };
 

  
 

  return (
    

    // Center the content in the screen
    <View style={{ flex: 1, flexDirection:"row", alignItems: 'center', backgroundColor: '#F2E5D7' }}>
      <View style={{ marginHorizontal: 160, marginRight:200 }}>
        <TouchableOpacity
                onPress={async () => {
        await CheckConditions();
      }}
                activeOpacity={0.7}
              >
                <Image 
                  source={require('../assets/button.png')}
                  style={{
                    width: 255,
                    height: 100,
                    position: 'absolute',
                    alignSelf: 'center', 
                  }}
                />
                <Text style={{
                  paddingTop: 30,
                  marginBottom: 40,
                  color: '#63372C',
                  fontSize: 20,
                  fontWeight: "bold",
                  fontFamily: "Pixel",
                }}>
                  Job Selection 
                </Text>
              </TouchableOpacity>
        <TouchableOpacity
                onPress={async () => {
        await navigateToJob('PartTime');
      }}
                activeOpacity={0.7}
              >
                <Image 
                  source={require('../assets/button.png')}
                  style={{
                    width: 255,
                    height: 100,
                    position: 'absolute',
                    alignSelf: 'center',

                  }}
                />
                <Text style={{
                  paddingTop: 30,
                  marginLeft: 30,
                  marginBottom: 30,
                  color: '#63372C',
                  fontSize: 20,
                  fontWeight: "bold",
                  fontFamily: "Pixel",
                }}>
                  Part-Time 
                </Text>
              </TouchableOpacity>
      </View>
      
      <View> 
        
        
        <TouchableOpacity
                onPress={async () => {
        await navigateToJob('Freelance');
      }}
                activeOpacity={0.7}
              >
                <Image 
                  source={require('../assets/button.png')}
                  style={{
                    width: 255,
                    height: 100,
                    position: 'absolute',
                    alignSelf: 'center', 
                  }}
                />
                <Text style={{
                  paddingTop: 30,
                  marginBottom: 40,
                  color: '#63372C',
                  fontSize: 20,
                  fontWeight: "bold",
                  fontFamily: "Pixel",
                }}>
                  Freelance
                </Text>
              </TouchableOpacity>
        
        <TouchableOpacity
                onPress={async () => {
        await navigateToJob('Company');
      }}
                activeOpacity={0.7}
              >
                <Image 
                  source={require('../assets/button.png')}
                  style={{
                    width: 255,
                    height: 100,
                    position: 'absolute',
                    alignSelf: 'center', 
                  }}
                />
                <Text style={{
                  paddingTop: 30,
                  marginBottom: 30,
                  color: '#63372C',
                  fontSize: 20,
                  fontWeight: "bold",
                  fontFamily: "Pixel",
                }}>
                  Company  
                </Text>
              </TouchableOpacity>
         </View>
        
    </View>
  );
}