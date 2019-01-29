#include "Window.h"
#include "Mat.h"
//#include <pthread.h>     

NAN_METHOD(NamedWindow) {
  std::string arg0 = *Nan::Utf8String(info[0]);
  cv::namedWindow( arg0, cv::WINDOW_OPENGL );
}

// void * imsho(void* arg){
//  cv::imshow( "a", *((cv::Mat*)arg));
//    // cv::waitKey(1);
// }

NAN_METHOD(Imshow) {
  std::string arg0 = *Nan::Utf8String(info[0]);
  Mat * mat = Nan::ObjectWrap::Unwrap<Mat>(info[1]->ToObject());
  cv::imshow( arg0, * mat->mat);
  
  // pthread_t h;
  // pthread_create(&h, NULL, imsho, (void*)&(* mat->mat));
  
}

NAN_METHOD(WaitKey) {
  int res = cv::waitKey(info[0]->Int32Value());
  info.GetReturnValue().Set(Nan::New(res));
}
