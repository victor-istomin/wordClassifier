cmake_minimum_required (VERSION 2.9)
project (cpp-trainer)

find_package (Threads)
set (CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++14 -Wall -march=native ")

add_executable(cpp-trainer ./woldsTrainer/woldsTrainer.cpp)

# add the binary tree to the search path for include files
target_include_directories(cpp-trainer PUBLIC "${PROJECT_SOURCE_DIR}/wordsTrainer")
target_include_directories(cpp-trainer PUBLIC "${PROJECT_SOURCE_DIR}/../tiny-cnn")
target_include_directories(cpp-trainer PUBLIC "${PROJECT_SOURCE_DIR}/../jsoncons/src")

target_link_libraries (cpp-trainer ${CMAKE_THREAD_LIBS_INIT})
target_link_libraries (cpp-trainer tbb)
