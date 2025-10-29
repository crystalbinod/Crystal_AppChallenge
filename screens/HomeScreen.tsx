// screens/HomeScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Button,TouchableOpacity, Image, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useFonts } from 'expo-font';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';


export default function HomeScreen() {
  // load custom fonts
  const [fontsLoaded] = useFonts({
    'LazyDaze': require('../assets/ATP-Lazy Daze.ttf'),
    'Windows': require('../assets/windows-bold.ttf'),
    'RetroBoulevard': require('../assets/Retro Boulevard.ttf'),
    'Pixel': require('../assets/pixel.ttf'),
  });
  const [displayName, setDisplayName] = useState('');
  React.useEffect(() => {
  const fetchUserName = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setDisplayName(userData.displayName || 'No Name');
        } else {
          console.log('No such document!');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    }
  };

  // Call the async function after defining it
  fetchUserName();
}, []); // ✅ Add dependency array so it only runs once

  // get the navigation object with proper typing for RootStackParamList
  // this makes sure TypeScript knows 'Details' exists and accepts 'id' as a param
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();





















  // main screen layout with two columns
  return (
    <View style={{ 
      flex: 1, 
      flexDirection: 'row',
      backgroundColor: '#F2E5D7',
      paddingLeft: 7, 
    }}>
      
      {/* LEFT COLUMN - first Box with Navigation Buttons */}
      <View style={{ 
        flex: 1, 
        backgroundColor: '#F2E5D7',
        marginBottom: 20,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        
        {/* Home Screen Title */}
        <Text style={{
          fontSize: 38,
          color: '#C97D60',
          fontFamily: 'Windows',
          fontWeight:"bold"
        }}>
          HOME SCREEN
        </Text>

        {/* Profile Button */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Profile', { id: '123' })}
          activeOpacity={0.7}
        >
          <Image 
            source={require('../assets/button.png')}
            style={{
              width: 200,
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
            Profile
          </Text>
        </TouchableOpacity>

        {/* Job Button */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Job')}
          activeOpacity={0.7}
        >
          <Image 
            source={require('../assets/button.png')}
            style={{
              width: 200,
              height: 100,
              position: 'absolute',
              alignSelf: 'center', 
            }}
          />
          <Text style={{
            paddingTop: 30,
            marginBottom: 10,
            color: '#63372C',
            fontSize: 20,
            fontWeight: "bold",
            fontFamily: "Pixel",
          }}>
            Job
          </Text>
        </TouchableOpacity>

        
      </View>

      {/* RIGHT COLUMN - Second Box with a Scroll*/}
      <ScrollView style={{ 
        flex: 1,
        backgroundColor: '#c78e71ff', 
        marginVertical: 7,
        marginRight: 10,
        borderRadius: 40,
        borderWidth: 5,
        borderColor: '#63372C',
      }}>
        
        {/* horizontal row Section - with Name label and Day label */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingRight: 10
        }}>
          <Text style={{
            margin: 7,
            flex: 1,
            backgroundColor: '#63372C', 
            marginVertical: 7,
            marginTop: 20,
            marginRight: 10,
            borderRadius: 10,
            borderWidth: 4,
            width: 150,
            fontFamily: 'Pixel',
            borderColor: '#63372C',
            color: '#000000ff',
          }}>
            Name: {displayName}
          </Text>
          <Text
            style={{
              marginTop: 10,
              backgroundColor: '#eec5c5ff',
              paddingVertical: 5,
              paddingHorizontal: 10,
              borderRadius: 5,
              width: 105,
            }}
          >
            <Text style={{
              color: '#63372C',
              fontFamily: 'Pixel',
              fontWeight: 'bold',
            }}>
              Day:
            </Text>
          </Text>
        </View>

        {/* horizontal row Section - with Job label and Next Day button */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingRight: 10
        }}>
          <Text style={{
            margin: 7,
            flexDirection: 'row',
            flex: 1,
            backgroundColor: '#63372C', 
            marginVertical: 7,
            marginRight: 10,
            borderRadius: 10,
            borderWidth: 4,
            width: 150,
            fontFamily: 'Pixel',
            borderColor: '#63372C' 
          }}>
            Job:
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#ffb5b5ff',
              paddingVertical: 5,
              paddingHorizontal: 10,
              borderRadius: 5,
              width: 105,
            }}
          >
            <Text style={{
              color: '#63372C',
              fontFamily: 'Pixel',
              fontWeight: 'bold',
            }}>
              Next Day
            </Text>
          </TouchableOpacity>
        </View>

        {/* Reminders Section */}
        <Text style={{
          margin: 7,
          flex: 1,
          backgroundColor: '#63372C', 
          marginVertical: 7,
          marginRight: 10,
          borderRadius: 10,
          borderWidth: 4,
          fontFamily: 'Pixel',
          borderColor: '#63372C'
        }}>
          Reminders: klasjflsdlfkj
        </Text>

        {/* Emergency Alerts Section */}
        <Text style={{
          margin: 7,
          flex: 1,
          backgroundColor: '#63372C', 
          marginVertical: 7,
          marginRight: 10,
          borderRadius: 10,
          borderWidth: 4,
          fontFamily: 'Pixel',
          borderColor: '#63372C'
        }}>
          Emergency Alerts: ksdlk fjlksdjf
        </Text>
        
      </ScrollView>
      
    </View>
  );
}
