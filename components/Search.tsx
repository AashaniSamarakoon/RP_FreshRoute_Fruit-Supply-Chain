import { Search as SearchIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { BuyerColors } from '../constants/theme';

interface SearchProps {
    value?: string;
    onChangeText?: (text: string) => void;
    placeholder?: string;
}

const Search = ({ value = "", onChangeText, placeholder = "Search fruits, SKUs..." }: SearchProps) => (
    <View style={styles.searchContainer}>
        <SearchIcon size={20} color={BuyerColors.textGray} style={styles.searchIcon} />
        <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={BuyerColors.textGray}
            style={styles.searchInput}
        />
    </View>
);

const styles = StyleSheet.create({
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        marginHorizontal: 20,
        marginTop: 10,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 50,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: BuyerColors.textBlack,
    },
});

export default Search;
