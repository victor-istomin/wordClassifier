#pragma once
#include <string>
#include <algorithm>
#include <cctype>

#include "tiny_cnn/tiny_cnn.h"

struct CommonTools
{
	// keep these values synchronized with ../../../common_tools.js
	// TODO - move to JSON file?
	static const char MIN_CODE   = 'a' - 1;   // a-1 is special non-alpha char like '
	static const char MAX_CODE   = 'z' + 1;   // z+1 is special space char, used for padding
	static const int  MAX_LENGTH = 15;

	static const char APOSTROPHE_CHAR = MIN_CODE;
	static const char PADDING_CHAR    = MAX_CODE;

	static std::string normalizeWord(const std::string& s)
	{
		std::string word = s.substr(0, MAX_LENGTH);

		if (word.length() < MAX_LENGTH)
			word += std::string(MAX_LENGTH - word.length(), PADDING_CHAR);

		std::transform(word.begin(), word.end(), word.begin(), [](char c) 
		{
			c = std::tolower(c);
			if (c == ' ')
				c = PADDING_CHAR;
			else if (c < MIN_CODE || c > MAX_CODE)
				c = APOSTROPHE_CHAR;

			return c;
		});

		return word;
	}

	static tiny_cnn::vec_t makeWordVector(const std::string& word)
	{
		const size_t charsVariety = (MAX_CODE - MIN_CODE);
		const size_t neuronsCount = charsVariety * MAX_LENGTH;
		tiny_cnn::vec_t codes(neuronsCount);

		std::string normalized = normalizeWord(word);
		for (size_t i = 0; i < neuronsCount; ++i)
		{
			char   thisChar = MIN_CODE + (i % charsVariety);
			size_t wordPos  = i / charsVariety;
			
			codes[i] = (normalized[wordPos] == thisChar) ? 1.0 : 0.0;
		}

		return std::move(codes);
	}

	
};
