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

WordsMap makeWordsMap(const std::string& file, WordVectors& wordVectors, WordVectorLabels& wordLabels, 
                                               WordVectors& lossCheckVectors, WordVectorLabels& lossCheckLabels)
{
	WordsMap words;
	wordVectors.clear();
	wordLabels.clear();

	json trainJson = json::parse_file(file);

	size_t index = 0;
	const auto trueVec  = tiny_cnn::vec_t(1, 1.0);
	const auto falseVec = tiny_cnn::vec_t(1, 0.0);

    const size_t LOSS_CHECK_SIZE = 5000;
    size_t lossCheckScale = trainJson.size() / LOSS_CHECK_SIZE;

	for(const auto& member : trainJson.members())
	{
		//std::cout << "name=" << member.name() << ", value=" << member.value().as<bool>() << std::endl;
		bool isWord = member.value().as<bool>();
		const std::string& name = member.name();

		words[name] = isWord;

        auto wordVector   = CommonTools::makeWordVector(name);
        auto labelsVector = isWord ? trueVec: falseVec;

        if ((index % lossCheckScale) == 0)
        {
            lossCheckVectors.push_back(wordVector);
            lossCheckLabels.push_back(labelsVector);
        }

		wordVectors.push_back(std::move(wordVector));
		wordLabels.push_back(std::move(labelsVector));

		if ((++index % 1000) == 0)
			std::cout << ".";
	}

    assert(lossCheckVectors.size() >= LOSS_CHECK_SIZE);
	std::cout << std::endl;
	return std::move(words);
}



void testEncoding()
{
    return ;/*
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
	std::cout << std::endl;*/
}

int main()
{
	// test encoding
	//testEncoding();

	Network          net = makeNetwork();
	WordVectors      wordsVectors, lossCheckVector;
	WordVectorLabels wordsLabels, lossCheckLabels;

	WordsMap words = makeWordsMap("../../../train-input.json", wordsVectors, wordsLabels, lossCheckVector, lossCheckLabels);

	try
	{
		int progress = 0;
        const int progressEnd = 1500;

        tiny_cnn::float_t previousLoss = 0;
        int minLoss = 0;

		auto progressFunc = [&net, &words, &wordsVectors, &wordsLabels, &lossCheckVector, &lossCheckLabels,
                             &progress, progressEnd, &previousLoss, &minLoss]()  // TODO - smaller testing data amount?
        {
            const int promille = progressEnd / 1000;
            const int percent  = progressEnd / 100;
            if (percent == 0 || promille == 0)
                return; // no sense to display progress

            if (0 == (++progress % (promille / 5 + 1)))
                std::cout << "." << std::flush;

            if (0 == (progress % (percent / 5)))
            {
                tiny_cnn::float_t loss = net.get_loss(lossCheckVector, lossCheckLabels);
                if (minLoss == 0)
                    minLoss = loss;

                auto& optimizer = net.optimizer();

                std::cout << progress / (double)percent << "% \tepoch: " << progress 
                          << "\t- loss: " << loss << "(prev: " << previousLoss
                          << "); alpha:" << optimizer.alpha;

                bool isRegression = previousLoss != 0 && loss > previousLoss;

                if (optimizer.alpha < 0.00001)
                {
                    optimizer.alpha = 0.02;
                }
                if (optimizer.alpha > 0.5)
                {
                    optimizer.alpha = isRegression ? 0.2 : 0.5; // still might be increased / decreased by bold driver
                }

                // "bold driver"
                double da = 1.01 + (1.0 - (tiny_cnn::float_t)progress / progressEnd) * 0.1;   // increate by 11..1%
                if (isRegression)
                    da = 0.5;

                optimizer.alpha *= da;
                std::cout << (da > 1.0 ? "\tup*" : "\tdown*") << da;

                bool isImprovingLoss = minLoss > loss;
                bool isStarted = (progress / percent) > 10;  // some time to start
                if (isStarted && isImprovingLoss)
                {
                    std::ofstream ofs(("words_" + std::to_string(words.size())
                                     + "_loss_" + std::to_string((int)loss)
                                     + "_epoch_" + std::to_string(progress)).c_str());
                    ofs << net;
                    std::cout << "; saved";
                }

                previousLoss = loss;
                if (isStarted)
                    minLoss = std::min((int)loss, minLoss);   // keep min loss high before first saving

                std::cout << std::endl;
            }
        };

        std::cout << "Training " << words.size() << " words... Initial optimizer alpha: " << net.optimizer().alpha << std::endl;
        net.optimizer().alpha = 0.3;  // 0.01 is default
		net.train(wordsVectors, wordsLabels, 1, progressEnd, tiny_cnn::nop, progressFunc, true, 1);
        std::cout << "Training finished at " << progress << std::endl;

        std::ofstream ofs(("words_" + std::to_string(words.size()) + "finish_" + std::to_string(progress)).c_str());
        ofs << net;
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
