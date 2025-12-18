import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StatusBar, StyleSheet, Alert } from 'react-native';
import {
  Entry,
  RichDoc,
  LanguageCode,
} from './src/types';
import { BASE_ENTRIES } from './src/types/baseData';
import colors from './src/theme/colors';
import HomeScreen from './src/screens/HomeScreen';
import EntryFormScreen from './src/screens/EntryFormScreen';
import DeleteEntryScreen from './src/screens/DeleteEntryScreen';
import SplashScreen from './src/screens/SplashScreen';
import {
  initDatabase,
  loadAllEntries,
  loadAllRichDocs,
  saveEntry,
  saveRichDoc,
  deleteEntry as deleteEntryFromDb,
  hasDataInDb,
  importBaseEntries,
} from './src/services/database';

type Screen = 'splash' | 'list' | 'create' | 'edit' | 'delete';

export default function App() {
  const [sourceLang, setSourceLang] = useState<LanguageCode>('vi');
  const [targetLang, setTargetLang] = useState<LanguageCode>('tay');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [activeScreen, setActiveScreen] = useState<Screen>('splash');
  const [currentEntryId, setCurrentEntryId] = useState<number | null>(null);
  const [docsMap, setDocsMap] = useState<Record<string, RichDoc>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [dbInitialized, setDbInitialized] = useState(false);

  // Initialize database and load data when app starts
  useEffect(() => {
    const initAndLoad = async () => {
      try {
        // Initialize database tables
        await initDatabase();
        setDbInitialized(true);

        // Always try to import base entries (will skip existing ones)
        // This ensures new base data from app updates is added
        await importBaseEntries(BASE_ENTRIES);

        // Load all entries from database
        const [savedEntries, savedDocs] = await Promise.all([
          loadAllEntries(),
          loadAllRichDocs(),
        ]);
        setEntries(savedEntries);
        setDocsMap(savedDocs);

      } catch (error) {
        console.error('Error initializing database:', error);
        setEntries(BASE_ENTRIES);
      } finally {
        setIsLoading(false);
      }
    };
    initAndLoad();
  }, []);

  const getDocKey = (entryId: number, lang: LanguageCode) => `${entryId}:${lang}`;

  const getDocForEntry = (entryId: number, lang: LanguageCode): RichDoc | undefined => {
    return docsMap[getDocKey(entryId, lang)];
  };

  // Navigation handlers
  const navigateToCreate = () => {
    setCurrentEntryId(null);
    setActiveScreen('create');
  };

  const navigateToEdit = (id: number) => {
    setCurrentEntryId(id);
    setActiveScreen('edit');
  };

  const navigateToDelete = (id: number) => {
    setCurrentEntryId(id);
    setActiveScreen('delete');
  };

  const navigateToList = () => {
    setActiveScreen('list');
  };

  // Entry handlers
  const handleSubmitCreate = async (entry: Entry, docForTarget: RichDoc | null) => {
    try {
      // Save to database
      await saveEntry(entry);
      if (docForTarget) {
        await saveRichDoc(entry.id, targetLang, docForTarget);
      }

      // Update state
      setEntries(prev => [entry, ...prev]);
      if (docForTarget) {
        const key = getDocKey(entry.id, targetLang);
        setDocsMap(prev => ({ ...prev, [key]: docForTarget }));
      }
    } catch (error) {
      console.error('Error saving entry:', error);
      Alert.alert('Lỗi', 'Không thể lưu mục từ');
    }
    setActiveScreen('list');
  };

  const handleSubmitEdit = async (entry: Entry, docForTarget: RichDoc | null) => {
    try {
      // Save to database
      await saveEntry(entry);
      if (docForTarget) {
        await saveRichDoc(entry.id, targetLang, docForTarget);
      }

      // Update state
      setEntries(prev => prev.map(e => (e.id === entry.id ? entry : e)));
      if (docForTarget) {
        const key = getDocKey(entry.id, targetLang);
        setDocsMap(prev => ({ ...prev, [key]: docForTarget }));
      }
    } catch (error) {
      console.error('Error updating entry:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật mục từ');
    }
    setActiveScreen('list');
  };

  const handleConfirmDelete = async () => {
    if (currentEntryId == null) {
      setActiveScreen('list');
      return;
    }
    const id = currentEntryId;

    try {
      // Delete from database
      await deleteEntryFromDb(id);

      // Update state
      setEntries(prev => prev.filter(e => e.id !== id));
      setDocsMap(prev => {
        const next: typeof prev = {};
        Object.entries(prev).forEach(([key, value]) => {
          const [idStr] = key.split(':');
          if (Number(idStr) !== id) {
            next[key] = value;
          }
        });
        return next;
      });
    } catch (error) {
      console.error('Error deleting entry:', error);
      Alert.alert('Lỗi', 'Không thể xóa mục từ');
    }
    setActiveScreen('list');
  };

  // Handle splash finish
  const handleSplashFinish = () => {
    setActiveScreen('list');
  };

  // Handle import entries
  const handleImportEntries = async (newEntries: Entry[], newDocs?: Record<string, RichDoc>) => {
    try {
      // Save to database
      for (const entry of newEntries) {
        await saveEntry(entry);
      }
      if (newDocs) {
        for (const [key, doc] of Object.entries(newDocs)) {
          const [entryIdStr, langCode] = key.split(':');
          await saveRichDoc(Number(entryIdStr), langCode as LanguageCode, doc);
        }
      }

      // Update state
      setEntries(prev => [...newEntries, ...prev]);
      if (newDocs) {
        setDocsMap(prev => ({ ...prev, ...newDocs }));
      }
    } catch (error) {
      console.error('Error importing entries:', error);
      Alert.alert('Lỗi', 'Không thể nhập dữ liệu');
    }
  };

  // Render current screen
  const renderScreen = () => {
    switch (activeScreen) {
      case 'splash':
        return <SplashScreen onFinish={handleSplashFinish} />;

      case 'list':
        return (
          <HomeScreen
            entries={entries}
            docsMap={docsMap}
            sourceLang={sourceLang}
            targetLang={targetLang}
            onChangeSourceLang={setSourceLang}
            onChangeTargetLang={setTargetLang}
            onNavigateCreate={navigateToCreate}
            onNavigateEdit={navigateToEdit}
            onNavigateDelete={navigateToDelete}
            onImportEntries={handleImportEntries}
          />
        );

      case 'create':
        return (
          <EntryFormScreen
            mode="create"
            sourceLang={sourceLang}
            targetLang={targetLang}
            onCancel={navigateToList}
            onSubmit={handleSubmitCreate}
          />
        );

      case 'edit': {
        const entry = entries.find(e => e.id === currentEntryId);
        const docForTarget = entry ? getDocForEntry(entry.id, targetLang) || null : null;
        if (!entry) {
          return (
            <HomeScreen
              entries={entries}
              docsMap={docsMap}
              sourceLang={sourceLang}
              targetLang={targetLang}
              onChangeSourceLang={setSourceLang}
              onChangeTargetLang={setTargetLang}
              onNavigateCreate={navigateToCreate}
              onNavigateEdit={navigateToEdit}
              onNavigateDelete={navigateToDelete}
              onImportEntries={handleImportEntries}
            />
          );
        }
        return (
          <EntryFormScreen
            mode="edit"
            sourceLang={sourceLang}
            targetLang={targetLang}
            initialEntry={entry}
            initialDocForTarget={docForTarget}
            onCancel={navigateToList}
            onSubmit={handleSubmitEdit}
          />
        );
      }

      case 'delete': {
        const entry = entries.find(e => e.id === currentEntryId);
        if (!entry) {
          return (
            <HomeScreen
              entries={entries}
              docsMap={docsMap}
              sourceLang={sourceLang}
              targetLang={targetLang}
              onChangeSourceLang={setSourceLang}
              onChangeTargetLang={setTargetLang}
              onNavigateCreate={navigateToCreate}
              onNavigateEdit={navigateToEdit}
              onNavigateDelete={navigateToDelete}
              onImportEntries={handleImportEntries}
            />
          );
        }
        return (
          <DeleteEntryScreen
            entry={entry}
            sourceLang={sourceLang}
            targetLang={targetLang}
            onCancel={navigateToList}
            onConfirm={handleConfirmDelete}
          />
        );
      }

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />
      {renderScreen()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    paddingTop: StatusBar.currentHeight || 0,
  },
});
