// import React, { useState, useRef, useEffect } from "react";
// import "./App.css";

// const API_URL = "http://127.0.0.1:5000/transcribe";

// const ALL_CATEGORIES = [
//   "Symptoms", "Medicine Names", "Dosage & Frequency", "Diseases / Conditions",
//   "Medical Procedures / Tests", "Duration", "Doctor's Instructions"
// ];

// function App() {
//   const [isRecording, setIsRecording] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [statusMessage, setStatusMessage] = useState("Select a language and click to start recording");
//   const [latestResult, setLatestResult] = useState(null);
//   const [history, setHistory] = useState([]);
//   const [isHistoryVisible, setIsHistoryVisible] = useState(false);
//   const [activeHistoryId, setActiveHistoryId] = useState(null);
//   const [newItemInputs, setNewItemInputs] = useState({});
//   const [showInputFor, setShowInputFor] = useState(null);
//   const [selectedLang, setSelectedLang] = useState('en'); // Default to English ('en')

//   const mediaRecorderRef = useRef(null);
//   const audioChunksRef = useRef([]);

//   useEffect(() => {
//     try {
//       const savedHistory = localStorage.getItem("transcriptionHistory");
//       if (savedHistory) setHistory(JSON.parse(savedHistory));
//     } catch (error) {
//       console.error("Could not load history from local storage:", error);
//     }
//   }, []);

//   useEffect(() => {
//     localStorage.setItem("transcriptionHistory", JSON.stringify(history));
//   }, [history]);

//   const handleStartRecording = async () => {
//     setLatestResult(null);
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       setIsRecording(true);
//       mediaRecorderRef.current = new MediaRecorder(stream);
//       audioChunksRef.current = [];
//       mediaRecorderRef.current.ondataavailable = e => audioChunksRef.current.push(e.data);
//       mediaRecorderRef.current.onstop = handleApiCall;
//       mediaRecorderRef.current.start();
//       setStatusMessage("🔴 Recording...");
//     } catch (err) {
//       setStatusMessage("Error: Could not access microphone.");
//     }
//   };

//   const handleStopRecording = () => {
//     if (mediaRecorderRef.current) {
//       mediaRecorderRef.current.stop();
//       setIsRecording(false);
//       setIsLoading(true);
//       setStatusMessage("Processing...");
//     }
//   };

//   const handleApiCall = async () => {
//     const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
//     const reader = new FileReader();
//     reader.readAsDataURL(audioBlob);
    
//     reader.onloadend = async () => {
//       const base64Audio = reader.result;
//       try {
//         const response = await fetch(API_URL, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ 
//             audioContent: base64Audio.split(',')[1],
//             language: selectedLang
//           }),
//         });
//         const data = await response.json();
//         if (!response.ok || data.error) throw new Error(data.details || data.error);
        
//         const resultWithUIVisibility = {
//           id: Date.now(),
//           ...data,
//           language: selectedLang,
//           visibleCategories: Object.keys(data.extracted_terms).filter(key => data.extracted_terms[key].length > 0)
//         };
        
//         setLatestResult(resultWithUIVisibility);
//         saveToHistory(base64Audio, resultWithUIVisibility);
//         setStatusMessage("✅ Success! Review the extracted details below.");
//       } catch (error) {
//         setStatusMessage(`Error: ${error.message}`);
//       } finally {
//         setIsLoading(false);
//       }
//     };
//   };
  
//   // All other helper functions (saveToHistory, handleShowCategory, etc.) remain the same
//   const saveToHistory = (audioBase64, result) => { const newHistoryItem = { id: result.id, date: new Date().toLocaleString(), audioBase64: audioBase64, result: result }; setHistory(prev => [newHistoryItem, ...prev]); };
//   const handleShowCategory = (itemId, category) => { const updateItem = item => item.id === itemId ? { ...item, visibleCategories: [...item.visibleCategories, category] } : item; setLatestResult(prev => (prev && prev.id === itemId ? updateItem(prev) : prev)); setHistory(prev => prev.map(histItem => histItem.id === itemId ? { ...histItem, result: updateItem(histItem.result) } : histItem)); };
//   const handleHideCategory = (itemId, categoryToHide) => { const updateItem = item => { if (item.id === itemId) { const newVisibleCategories = item.visibleCategories.filter(cat => cat !== categoryToHide); return { ...item, visibleCategories: newVisibleCategories }; } return item; }; setLatestResult(prev => (prev && prev.id === itemId ? updateItem(prev) : prev)); setHistory(prev => prev.map(histItem => histItem.id === itemId ? { ...histItem, result: updateItem(histItem.result) } : histItem)); };
//   const handleRemoveItem = (itemId, category, itemIndex) => { const updateItem = item => { if (item.id === itemId) { const newExtractedTerms = { ...item.extracted_terms }; const newTermsArray = [...newExtractedTerms[category]]; newTermsArray.splice(itemIndex, 1); newExtractedTerms[category] = newTermsArray; return { ...item, extracted_terms: newExtractedTerms }; } return item; }; setLatestResult(prev => (prev && prev.id === itemId ? updateItem(prev) : prev)); setHistory(prev => prev.map(histItem => histItem.id === itemId ? { ...histItem, result: updateItem(histItem.result) } : histItem)); };
//   const handleAddItem = (itemId, category) => { const inputKey = `${itemId}-${category}`; const termToAdd = newItemInputs[inputKey]; if (!termToAdd || !termToAdd.trim()) return; const updateItem = item => { if (item.id === itemId) { const newExtractedTerms = { ...item.extracted_terms }; const oldTermsArray = newExtractedTerms[category] || []; const newTermsArray = [...oldTermsArray, termToAdd]; newExtractedTerms[category] = newTermsArray; return { ...item, extracted_terms: newExtractedTerms }; } return item; }; setLatestResult(prev => (prev && prev.id === itemId ? updateItem(prev) : prev)); setHistory(prev => prev.map(histItem => histItem.id === itemId ? { ...histItem, result: updateItem(histItem.result) } : histItem)); setNewItemInputs(prev => ({ ...prev, [inputKey]: '' })); setShowInputFor(null); };
//   const handleInputChange = (itemId, category, value) => { setNewItemInputs(prev => ({ ...prev, [`${itemId}-${category}`]: value })); };
//   const deleteHistoryItem = (idToDelete, e) => { e.stopPropagation(); setHistory(prev => prev.filter(item => item.id !== idToDelete)); };
//   const toggleAccordion = (id) => { setActiveHistoryId(prevId => (prevId === id ? null : id)); };
//   const renderResultCards = (item) => { const shownCategories = new Set(item.visibleCategories); const hiddenCategories = ALL_CATEGORIES.filter(cat => !shownCategories.has(cat)); return ( <> <h4 className="section-title">Extracted Medical Details</h4> <div className="extracted-cards-container"> {ALL_CATEGORIES.map(category => ( shownCategories.has(category) && ( <div key={`${item.id}-${category}`} className="category-card"> <div className="card-header"> <h4>{category.replace(/_/g, " ")}</h4> <div className="card-buttons"> <button className="card-action-btn card-delete-btn" onClick={() => handleHideCategory(item.id, category)}>×</button> <button className="card-action-btn" onClick={() => setShowInputFor(`${item.id}-${category}`)}>+</button> </div> </div> <div className="bubbles-container"> {item.extracted_terms[category]?.map((term, index) => ( <div key={index} className="bubble"> {term} <button className="remove-btn" onClick={() => handleRemoveItem(item.id, category, index)}>×</button> </div> ))} </div> {showInputFor === `${item.id}-${category}` && ( <div className="add-item-form"> <input type="text" autoFocus placeholder="Add new..." value={newItemInputs[`${item.id}-${category}`] || ''} onChange={(e) => handleInputChange(item.id, category, e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleAddItem(item.id, category) }} /> </div> )} </div> ) ))} </div> {hiddenCategories.length > 0 && ( <> <h4 className="section-title">Add Missing Details</h4> <div className="missing-details-container"> {hiddenCategories.map(category => ( <button key={category} className="add-category-btn" onClick={() => handleShowCategory(item.id, category)} > + {category.replace(/_/g, " ")} </button> ))} </div> </> )} </> ); };

//   return (
//     <div className="app-container">
//       <button className="history-btn" onClick={() => setIsHistoryVisible(true)}>History</button>
      
//       <h2>AI Medical Transcription Assistant</h2>

//       <div className="language-selector">
//         <label className={selectedLang === 'en' ? 'active' : ''}>
//           <input type="radio" name="language" value="en" checked={selectedLang === 'en'} onChange={(e) => setSelectedLang(e.target.value)} />
//           English
//         </label>
//         <label className={selectedLang === 'ml' ? 'active' : ''}>
//           <input type="radio" name="language" value="ml" checked={selectedLang === 'ml'} onChange={(e) => setSelectedLang(e.target.value)} />
//           Malayalam
//         </label>
//         <label className={selectedLang === 'hi' ? 'active' : ''}>
//           <input type="radio" name="language" value="hi" checked={selectedLang === 'hi'} onChange={(e) => setSelectedLang(e.target.value)} />
//           Hindi
//         </label>
//       </div>

//       <div className="controls">
//         <button 
//           className={`mic-button ${isRecording ? 'stop' : 'start'}`}
//           onClick={isRecording ? handleStopRecording : handleStartRecording}
//           disabled={isLoading}
//         >
//           {isRecording ? '⏹️ Stop Recording' : '🎙️ Start Recording'}
//         </button>
//         {isLoading ? ( <div className="loader-container"><div className="loader"></div><p className="status-text">{statusMessage}</p></div> ) : (<p className="status-text">{statusMessage}</p>)}
//       </div>

//       {latestResult && ( <> <hr className="separator" /> <div className="history-item"> <p className="transcript">{latestResult.final_english_text}</p> {renderResultCards(latestResult)} </div> </> )}
//       {isHistoryVisible && ( <div className="modal-overlay" onClick={() => setIsHistoryVisible(false)}> <div className="modal-content" onClick={(e) => e.stopPropagation()}> <div className="modal-header"><h3>Transcription History</h3><button className="modal-close-btn" onClick={() => setIsHistoryVisible(false)}>×</button></div> <div className="history-list"> {history.length > 0 ? history.map(histItem => ( <div key={histItem.id} className={`history-list-item ${activeHistoryId === histItem.id ? 'active' : ''}`}> <div className="history-summary" onClick={() => toggleAccordion(histItem.id)}><time>{histItem.date}</time><button className="history-delete-btn" onClick={(e) => deleteHistoryItem(histItem.id, e)}>Delete</button></div> {activeHistoryId === histItem.id && ( <div className="history-details"> <audio controls src={histItem.audioBase64}></audio> <p className="transcript">{histItem.result.final_english_text}</p> {renderResultCards(histItem.result)} </div> )} </div> )) : <p>No history found.</p>} </div> </div> </div> )}
//     </div>
//   );
// }

// export default App;



import React, { useState, useRef, useEffect } from "react";
import "./App.css";

const API_URL = "https://medical-transcription-backend.onrender.com/transcribe";

const ALL_CATEGORIES = [
  "Symptoms", "Medicine Names", "Dosage & Frequency", "Diseases / Conditions",
  "Medical Procedures / Tests", "Duration", "Doctor's Instructions"
];

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Select a language and click to start recording");
  const [latestResult, setLatestResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [activeHistoryId, setActiveHistoryId] = useState(null);
  const [newItemInputs, setNewItemInputs] = useState({});
  const [showInputFor, setShowInputFor] = useState(null);
  const [selectedLang, setSelectedLang] = useState('en');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const statusTimeoutRef = useRef(null);

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem("transcriptionHistory");
      if (savedHistory) setHistory(JSON.parse(savedHistory));
    } catch (error) {
      console.error("Could not load history from local storage:", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("transcriptionHistory", JSON.stringify(history));
  }, [history]);

  const handleStartRecording = async () => {
    setLatestResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = e => audioChunksRef.current.push(e.data);
      mediaRecorderRef.current.onstop = handleApiCall;
      mediaRecorderRef.current.start();
      setStatusMessage("🔴 Recording...");
    } catch (err) {
      setStatusMessage("Error: Could not access microphone.");
    }
  };

  const startProcessingStatusSequence = () => {
    const messages = [
      "Transcribing with Bhashini...", "Translating to English...", 
      "Analyzing with local AI...", "Finalizing results..."
    ];
    let index = 0;
    const nextMessage = () => {
      if (index < messages.length) {
        setStatusMessage(messages[index]);
        index++;
        statusTimeoutRef.current = setTimeout(nextMessage, 2000);
      }
    };
    nextMessage();
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsLoading(true);
      startProcessingStatusSequence();
    }
  };

  const handleApiCall = async () => {
    clearTimeout(statusTimeoutRef.current);
    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    
    reader.onloadend = async () => {
      const base64Audio = reader.result;
      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            audioContent: base64Audio.split(',')[1],
            language: selectedLang
          }),
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'An unknown server error occurred.');
        
        const resultWithUIVisibility = {
          id: Date.now(),
          ...data,
          language: selectedLang,
          visibleCategories: Object.keys(data.extracted_terms || {}).filter(key => data.extracted_terms[key]?.length > 0)
        };
        
        setLatestResult(resultWithUIVisibility);
        saveToHistory(base64Audio, resultWithUIVisibility);
        setStatusMessage("✅ Success! Review the extracted details below.");
      } catch (error) {
        setStatusMessage(`Error: ${error.message}`);
      } finally {
        clearTimeout(statusTimeoutRef.current);
        setIsLoading(false);
      }
    };
  };

  const saveToHistory = (audioBase64, result) => { const newHistoryItem = { id: result.id, date: new Date().toLocaleString(), audioBase64: audioBase64, result: result }; setHistory(prev => [newHistoryItem, ...prev]); };
  const handleShowCategory = (itemId, category) => { const updateItem = item => item.id === itemId ? { ...item, visibleCategories: [...item.visibleCategories, category] } : item; setLatestResult(prev => (prev && prev.id === itemId ? updateItem(prev) : prev)); setHistory(prev => prev.map(histItem => histItem.id === itemId ? { ...histItem, result: updateItem(histItem.result) } : histItem)); };
  const handleHideCategory = (itemId, categoryToHide) => { const updateItem = item => { if (item.id === itemId) { const newVisibleCategories = item.visibleCategories.filter(cat => cat !== categoryToHide); return { ...item, visibleCategories: newVisibleCategories }; } return item; }; setLatestResult(prev => (prev && prev.id === itemId ? updateItem(prev) : prev)); setHistory(prev => prev.map(histItem => histItem.id === itemId ? { ...histItem, result: updateItem(histItem.result) } : histItem)); };
  const handleRemoveItem = (itemId, category, itemIndex) => { const updateItem = item => { if (item.id === itemId) { const newExtractedTerms = { ...item.extracted_terms }; const newTermsArray = [...newExtractedTerms[category]]; newTermsArray.splice(itemIndex, 1); newExtractedTerms[category] = newTermsArray; return { ...item, extracted_terms: newExtractedTerms }; } return item; }; setLatestResult(prev => (prev && prev.id === itemId ? updateItem(prev) : prev)); setHistory(prev => prev.map(histItem => histItem.id === itemId ? { ...histItem, result: updateItem(histItem.result) } : histItem)); };
  const handleAddItem = (itemId, category) => { const inputKey = `${itemId}-${category}`; const termToAdd = newItemInputs[inputKey]; if (!termToAdd || !termToAdd.trim()) return; const updateItem = item => { if (item.id === itemId) { const newExtractedTerms = { ...item.extracted_terms }; const oldTermsArray = newExtractedTerms[category] || []; const newTermsArray = [...oldTermsArray, termToAdd]; newExtractedTerms[category] = newTermsArray; return { ...item, extracted_terms: newExtractedTerms }; } return item; }; setLatestResult(prev => (prev && prev.id === itemId ? updateItem(prev) : prev)); setHistory(prev => prev.map(histItem => histItem.id === itemId ? { ...histItem, result: updateItem(histItem.result) } : histItem)); setNewItemInputs(prev => ({ ...prev, [inputKey]: '' })); setShowInputFor(null); };
  const handleInputChange = (itemId, category, value) => { setNewItemInputs(prev => ({ ...prev, [`${itemId}-${category}`]: value })); };
  const deleteHistoryItem = (idToDelete, e) => { e.stopPropagation(); setHistory(prev => prev.filter(item => item.id !== idToDelete)); };
  const toggleAccordion = (id) => { setActiveHistoryId(prevId => (prevId === id ? null : id)); };

  const renderResultCards = (item) => {
    const shownCategories = new Set(item.visibleCategories);
    const hiddenCategories = ALL_CATEGORIES.filter(cat => !shownCategories.has(cat));
    return (
      <>
        <h4 className="section-title">Extracted Medical Details</h4>
        <div className="extracted-cards-container">
          {ALL_CATEGORIES.map(category => (
            shownCategories.has(category) && (
              <div key={`${item.id}-${category}`} className="category-card">
                <div className="card-header">
                  <h4>{category.replace(/_/g, " ")}</h4>
                  <div className="card-buttons">
                    <button className="card-action-btn card-delete-btn" onClick={() => handleHideCategory(item.id, category)}>×</button>
                    <button className="card-action-btn" onClick={() => setShowInputFor(`${item.id}-${category}`)}>+</button>
                  </div>
                </div>
                <div className="bubbles-container">
                  {/* CORRECTED TYPO HERE */}
                  {item.extracted_terms[category]?.map((term, index) => (
                    <div key={index} className="bubble">
                      {term}
                      <button className="remove-btn" onClick={() => handleRemoveItem(item.id, category, index)}>×</button>
                    </div>
                  ))}
                </div>
                {showInputFor === `${item.id}-${category}` && (
                  <div className="add-item-form">
                    <input type="text" autoFocus placeholder="Add new..." value={newItemInputs[`${item.id}-${category}`] || ''} onChange={(e) => handleInputChange(item.id, category, e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleAddItem(item.id, category) }} />
                  </div>
                )}
              </div>
            )
          ))}
        </div>
        {hiddenCategories.length > 0 && (
          <>
            <h4 className="section-title">Add Missing Details</h4>
            <div className="missing-details-container">
              {hiddenCategories.map(category => (
                <button key={category} className="add-category-btn" onClick={() => handleShowCategory(item.id, category)} >
                  + {category.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </>
        )}
      </>
    );
  };

  return (
    <div className="app-container">
      <button className="history-btn" onClick={() => setIsHistoryVisible(true)}>History</button>
      <h2>AI Medical Transcription Assistant</h2>
      <div className="language-selector">
        <label className={selectedLang === 'en' ? 'active' : ''}><input type="radio" name="language" value="en" checked={selectedLang === 'en'} onChange={(e) => setSelectedLang(e.target.value)} />English</label>
        <label className={selectedLang === 'ml' ? 'active' : ''}><input type="radio" name="language" value="ml" checked={selectedLang === 'ml'} onChange={(e) => setSelectedLang(e.target.value)} />Malayalam</label>
        <label className={selectedLang === 'hi' ? 'active' : ''}><input type="radio" name="language" value="hi" checked={selectedLang === 'hi'} onChange={(e) => setSelectedLang(e.target.value)} />Hindi</label>
      </div>

      <div className="controls">
        <button
          className={`mic-button ${isRecording ? 'stop' : 'start'}`}
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          disabled={isLoading}
        >
          {isRecording ? '⏹️ Stop Recording' : '🎙️ Start Recording'}
        </button>

        {isRecording && (
          <div className="voice-visualizer">
            <div className="visualizer-bars">
              <span className="bar"></span><span className="bar"></span><span className="bar"></span><span className="bar"></span><span className="bar"></span>
            </div>
            <svg className="mic-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14q.825 0 1.413-.587Q14 12.825 14 12V6q0-.825-.587-1.413Q12.825 4 12 4q-.825 0-1.412.587Q10 5.175 10 6v6q0 .825.588 1.413Q11.175 14 12 14Zm-2 6v-3.075q-2.6-.35-4.3-2.288Q4 12.7 4 10.5h2q0 1.875 1.313 3.187Q8.625 15 10.5 15q1.875 0 3.188-1.313Q15 12.375 15 10.5h2q0 2.2-1.7 4.137Q13.6 16.575 11 16.925V20h-1Z"/></svg>
            <div className="visualizer-bars right">
              <span className="bar"></span><span className="bar"></span><span className="bar"></span><span className="bar"></span><span className="bar"></span>
            </div>
          </div>
        )}
        
        {isLoading && !isRecording && (
            <div className="loader-container"><div className="loader"></div><p className="status-text">{statusMessage}</p></div>
        )}
        {!isLoading && !isRecording && (
             <p className="status-text">{statusMessage}</p>
        )}
      </div>

      {latestResult && ( <> <hr className="separator" /> <div className="history-item"> <p className="transcript">{latestResult.final_english_text}</p> {renderResultCards(latestResult)} </div> </> )}
      {isHistoryVisible && ( <div className="modal-overlay" onClick={() => setIsHistoryVisible(false)}> <div className="modal-content" onClick={(e) => e.stopPropagation()}> <div className="modal-header"><h3>Transcription History</h3><button className="modal-close-btn" onClick={() => setIsHistoryVisible(false)}>×</button></div> <div className="history-list"> {history.length > 0 ? history.map(histItem => ( <div key={histItem.id} className={`history-list-item ${activeHistoryId === histItem.id ? 'active' : ''}`}> <div className="history-summary" onClick={() => toggleAccordion(histItem.id)}><time>{histItem.date}</time><button className="history-delete-btn" onClick={(e) => deleteHistoryItem(histItem.id, e)}>Delete</button></div> {activeHistoryId === histItem.id && ( <div className="history-details"> <audio controls src={histItem.audioBase64}></audio> <p className="transcript">{histItem.result.final_english_text}</p> {renderResultCards(histItem.result)} </div> )} </div> )) : <p>No history found.</p>} </div> </div> </div> )}
    </div>
  );
}

export default App;