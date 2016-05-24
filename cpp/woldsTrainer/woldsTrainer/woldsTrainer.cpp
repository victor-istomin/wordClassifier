#include "tiny_cnn/tiny_cnn.h"
#include "jsoncons/json.hpp"
#include "common_tools.h"

#include <string>
#include <unordered_map>
#include <iostream>

using jsoncons::json;
using jsoncons::pretty_print;

typedef tiny_cnn::network<tiny_cnn::mse, tiny_cnn::gradient_descent> Network;
typedef std::unordered_map<std::string, bool>                        WordsMap;
typedef std::vector<tiny_cnn::vec_t>                                 WordVectors;
//typedef std::vector<tiny_cnn::label_t>                               WordVectorLabels;//  TODO : what is regression?
typedef std::vector<tiny_cnn::vec_t>                               WordVectorLabels;

Network makeNetwork() 
{
	Network net;

	// props: {"input":405,"hidden":15,"output":1}
	net << tiny_cnn::fully_connected_layer<tiny_cnn::activation::sigmoid>(405, 15)
		<< tiny_cnn::fully_connected_layer<tiny_cnn::activation::sigmoid>(15, 1);

	assert(net.in_dim()  == 405);
	assert(net.out_dim() == 1);

	return std::move(net);
}

WordsMap makeWordsMap(const std::string& file, WordVectors& wordVectors, WordVectorLabels& wordLabels)
{
	WordsMap words;
	wordVectors.clear();
	wordLabels.clear();

	json trainJson = json::parse_file(file);

	size_t index = 0;
	const auto trueVec  = tiny_cnn::vec_t(1, 1.0);
	const auto falseVec = tiny_cnn::vec_t(1, 0.0);

	for(const auto& member : trainJson.members())
	{
		//std::cout << "name=" << member.name() << ", value=" << member.value().as<bool>() << std::endl;
		bool isWord = member.value().as<bool>();
		const std::string& name = member.name();

		words[name] = isWord;

		wordVectors.push_back(CommonTools::makeWordVector(name));
		wordLabels.push_back(isWord ? trueVec: falseVec);

		if ((++index % 1000) == 0)
			std::cout << ".";
	}

	std::cout << std::endl;
	return std::move(words);
}



void testEncoding()
{
	std::string w1 = CommonTools::normalizeWord("cote d'azur");
	std::string w2 = CommonTools::normalizeWord("NEBUCHADNEZZARII");

	auto v1 = CommonTools::makeWordVector(w1);
	auto v2 = CommonTools::makeWordVector(w2);

	std::cout << w1 << " - ";
	for (auto c : v1)
		std::cout << c << ";";

	std::cout << std::endl << w2 << " - ";
	for (auto c : v2)
		std::cout << c << ";";
	std::cout << std::endl;
}

int main()
{
	// test encoding
	testEncoding();

	Network          net = makeNetwork();
	WordVectors      wordsVectors;
	WordVectorLabels wordsLabels;

	WordsMap words = makeWordsMap("../../../train-input.json", wordsVectors, wordsLabels);

	try
	{
		int progress = 0;
        const int progressEnd = words.size();

		auto progressFunc = [&progress, progressEnd]()
        {
            const int promille = progressEnd / 1000;
            const int percent  = progressEnd / 100;
            if (percent == 0 || promille == 0)
                return; // no sense to display progress

            if (0 == (++progress % (promille / 2 + 1)))
                std::cout << "." << std::flush;
            if (0 == (progress % (percent * 10)))
                std::cout << progress / percent << "%" << std::endl;
        };

        std::cout << "Training " << progressEnd << " words..." << std::flush;
		net.train(wordsVectors, wordsLabels, 1, 1000, tiny_cnn::nop, progressFunc, true, 2);
	}
	catch (const std::exception& e)
	{
		std::cerr << e.what() << std::endl;
	}

	std::string testData[] = { "tritoxide", "grasswork", "grass", "unflanged", "oryctologic", "lamb's", "lamb", "bonsai's", 
		                     "bonsai", "pelagia", "belaz", "pelaz", "lampelagia", "racis", "stical", "mand", "critoxide", 
		                     "cridoxide", "crepoxize", "classwork" };

	for (const auto& word : testData)
	{
		auto result = net.predict(CommonTools::makeWordVector(word));

		std::cout << word << " - ";
		for (auto p : result)
			std::cout << p << ";";
		std::cout << std::endl;
	}

	return 0;
}
