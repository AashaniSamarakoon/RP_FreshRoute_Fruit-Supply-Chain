import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Search as SearchIcon } from 'lucide-react-native';
import { BuyerColors } from '../../../constants/theme';

const Search = () => (
    <View style={styles.searchContainer}>
        <SearchIcon size={20} color={BuyerColors.textGray} style={styles.searchIcon} />
        <TextInput
            placeholder="Search fruits, SKUs..."
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