import React, { useState, useEffect } from 'react';

// Post-process voice recognition results to fix common misinterpretations
const postProcessTranscript = (transcript) => {
  let processed = transcript.toLowerCase().trim();
  
  // Remove trailing punctuation (periods, question marks, exclamation marks)
  processed = processed.replace(/[.!?]+$/, '');
  
  // Common misinterpretations mapping
  const corrections = {
    // UC variations
    'you see': 'UC',
    'you c': 'UC',
    'you see?': 'UC',
    'you c?': 'UC',
    'y u c': 'UC',
    'y u see': 'UC',
    'why you see': 'UC',
    'why you c': 'UC',
    'y u c?': 'UC',
    'y u see?': 'UC',
    
    // Name corrections
    'same': 'Saim',
    'sam': 'Saim',
    'saim': 'Saim',
    'saem': 'Saim',
    'saam': 'Saim',
    'saeem': 'Saim',
    
    // Common name variations
    'ahmed': 'Ahmed',
    'ahmad': 'Ahmed',
    'ahmed': 'Ahmed',
    'ali': 'Ali',
    'aly': 'Ali',
    'hassan': 'Hassan',
    'hasan': 'Hassan',
    'hussain': 'Hussain',
    'hussain': 'Hussain',
    'muhammad': 'Muhammad',
    'mohammad': 'Muhammad',
    'mohammed': 'Muhammad',
    'umar': 'Umar',
    'usman': 'Usman',
    'osman': 'Usman',
    'ibrahim': 'Ibrahim',
    'ibraheem': 'Ibrahim',
    'yusuf': 'Yusuf',
    'yousef': 'Yusuf',
    'khalid': 'Khalid',
    'khaled': 'Khalid',
    'omar': 'Omar',
    'umar': 'Omar',
    'nadeem': 'Nadeem',
    'nadeem': 'Nadeem',
    'raheem': 'Raheem',
    'raheem': 'Raheem',
    'waqas': 'Waqas',
    'waqas': 'Waqas',
    'zahid': 'Zahid',
    'zaheed': 'Zahid',
    'tariq': 'Tariq',
    'tareeq': 'Tariq',
    'farooq': 'Farooq',
    'farooq': 'Farooq',
    'javed': 'Javed',
    'javeed': 'Javed',
    'naveed': 'Naveed',
    'naveed': 'Naveed',
    'shahid': 'Shahid',
    'shaheed': 'Shahid',
    'asif': 'Asif',
    'aseef': 'Asif',
    'basit': 'Basit',
    'baseet': 'Basit',
    'faisal': 'Faisal',
    'fayyaz': 'Fayyaz',
    'fayaz': 'Fayyaz',
    'imran': 'Imran',
    'emran': 'Imran',
    'kamran': 'Kamran',
    'kumran': 'Kamran',
    'salman': 'Salman',
    'sulman': 'Salman',
    'tahir': 'Tahir',
    'taheer': 'Tahir',
    'waseem': 'Waseem',
    'waseem': 'Waseem',
    'yasir': 'Yasir',
    'yaseer': 'Yasir',
    'zafar': 'Zafar',
    'zaffar': 'Zafar',
    'zubair': 'Zubair',
    'zubair': 'Zubair',
    
    // Additional common mishearings
    'mike': 'Mike',
    'john': 'John',
    'david': 'David',
    'dave': 'David',
    'steve': 'Steve',
    'steven': 'Steve',
    'robert': 'Robert',
    'bob': 'Robert',
    'william': 'William',
    'bill': 'William',
    'james': 'James',
    'jim': 'James',
    'charles': 'Charles',
    'charlie': 'Charles',
    'thomas': 'Thomas',
    'tom': 'Thomas',
    'richard': 'Richard',
    'rick': 'Richard',
    'daniel': 'Daniel',
    'dan': 'Daniel',
    'matthew': 'Matthew',
    'matt': 'Matthew',
    'anthony': 'Anthony',
    'tony': 'Anthony',
    'mark': 'Mark',
    'paul': 'Paul',
    'andrew': 'Andrew',
    'andy': 'Andrew',
    'joshua': 'Joshua',
    'josh': 'Joshua',
    'kenneth': 'Kenneth',
    'ken': 'Kenneth',
    'kevin': 'Kevin',
    'brian': 'Brian',
    'george': 'George',
    'timothy': 'Timothy',
    'tim': 'Timothy',
    'ronald': 'Ronald',
    'ron': 'Ronald',
    'jason': 'Jason',
    'jeffrey': 'Jeffrey',
    'jeff': 'Jeffrey',
    'ryan': 'Ryan',
    'jacob': 'Jacob',
    'jake': 'Jacob',
    'gary': 'Gary',
    'nicholas': 'Nicholas',
    'nick': 'Nicholas',
    'eric': 'Eric',
    'jonathan': 'Jonathan',
    'jon': 'Jonathan',
    'stephen': 'Stephen',
    'steve': 'Stephen',
    'larry': 'Larry',
    'justin': 'Justin',
    'scott': 'Scott',
    'brandon': 'Brandon',
    'benjamin': 'Benjamin',
    'ben': 'Benjamin',
    'samuel': 'Samuel',
    'sam': 'Samuel',
    'gregory': 'Gregory',
    'greg': 'Gregory',
    'alexander': 'Alexander',
    'alex': 'Alexander',
    'patrick': 'Patrick',
    'pat': 'Patrick',
    'jack': 'Jack',
    'dennis': 'Dennis',
    'jerry': 'Jerry',
    'tyler': 'Tyler',
    'aaron': 'Aaron',
    'jose': 'Jose',
    'henry': 'Henry',
    'douglas': 'Douglas',
    'doug': 'Douglas',
    'adam': 'Adam',
    'peter': 'Peter',
    'nathan': 'Nathan',
    'nathaniel': 'Nathaniel',
    'nathan': 'Nathaniel',
    'zachary': 'Zachary',
    'zach': 'Zachary',
    'kyle': 'Kyle',
    'noah': 'Noah',
    'alan': 'Alan',
    'jeremy': 'Jeremy',
    'jerry': 'Jeremy',
    'christopher': 'Christopher',
    'chris': 'Christopher',
    'sean': 'Sean',
    'shawn': 'Sean',
    'keith': 'Keith',
    'roger': 'Roger',
    'ralph': 'Ralph',
    'wayne': 'Wayne',
    'eugene': 'Eugene',
    'gene': 'Eugene',
    'louis': 'Louis',
    'lou': 'Louis',
    'philip': 'Philip',
    'phil': 'Philip',
    'bobby': 'Bobby',
    'jimmy': 'Jimmy',
    'johnny': 'Johnny',
    'billy': 'Billy',
    'danny': 'Danny',
    'tommy': 'Tommy',
    'mikey': 'Mikey',
    'stevie': 'Stevie',
    'davey': 'Davey',
    'bobby': 'Bobby',
    'jimmy': 'Jimmy',
    'johnny': 'Johnny',
    'billy': 'Billy',
    'danny': 'Danny',
    'tommy': 'Tommy',
    'mikey': 'Mikey',
    'stevie': 'Stevie',
    'davey': 'Davey'
  };
  
  // Check for exact matches first
  if (corrections[processed]) {
    return corrections[processed];
  }
  
  // Check for partial matches
  for (const [wrong, correct] of Object.entries(corrections)) {
    if (processed.includes(wrong)) {
      return processed.replace(wrong, correct);
    }
  }
  
  // If no corrections found, try to capitalize the first letter for proper names
  if (processed.length > 0) {
    return processed.charAt(0).toUpperCase() + processed.slice(1);
  }
  
  return processed;
};

// Function to add custom name corrections (can be called from parent components)
export const addNameCorrection = (misheard, correct) => {
  // This could be extended to store corrections in localStorage or send to backend
  console.log(`Name correction added: "${misheard}" -> "${correct}"`);
};

const VoiceSearch = ({ onResult }) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.lang = 'en-US';
      
      // Add confidence threshold for better accuracy
      recognition.onresult = (event) => {
        console.log('Voice recognition result:', event);
        const result = event.results[0];
        const confidence = result[0].confidence;
        const transcript = result[0].transcript;
        
        console.log('Confidence:', confidence, 'Transcript:', transcript);
        
        // Lower confidence threshold and always process results
        if (confidence > 0.1) {
          let processedTranscript = postProcessTranscript(transcript);
          console.log('Processed transcript:', processedTranscript);
          onResult(processedTranscript);
        } else {
          console.log('Low confidence result, but processing anyway:', transcript);
          let processedTranscript = postProcessTranscript(transcript);
          onResult(processedTranscript);
        }
        
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognition.onstart = () => {
        console.log('Voice recognition started');
      };

      recognition.onend = () => {
        console.log('Voice recognition ended');
        setIsListening(false);
      };

      setRecognition(recognition);
      setIsSupported(true);
    } else {
      console.warn('Speech recognition not supported in this browser');
      setIsSupported(false);
    }
  }, [onResult]);

  const toggleListening = () => {
    if (!recognition) {
      console.error('Speech recognition not available');
      return;
    }
    
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      try {
        recognition.start();
        setIsListening(true);
        console.log('Started voice recognition');
      } catch (error) {
        console.error('Error starting voice recognition:', error);
        setIsListening(false);
      }
    }
  };

  if (!isSupported) {
    return (
      <div className="flex items-center">
        <button
          disabled
          className="p-2 rounded-full bg-gray-100 text-gray-400 cursor-not-allowed"
          title="Voice search not supported in this browser"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
          </svg>
        </button>
        <span className="ml-2 text-sm text-gray-400">Not supported</span>
      </div>
    );
  }

  return (
    <div className="flex items-center">
      <button
        onClick={toggleListening}
        className={`p-2 rounded-full ${
          isListening
            ? 'bg-red-500 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
        title={isListening ? 'Stop listening' : 'Start voice search'}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
        </svg>
      </button>
      {isListening && (
        <span className="ml-2 text-sm text-gray-500">Listening...</span>
      )}
    </div>
  );
};

export default VoiceSearch;