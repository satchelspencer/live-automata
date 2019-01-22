#include <nan.h>
#include "Mat.h"
#include "Window.h"
#include "Image.h"
#include "ImgProc.h"
#include "VideoCapture.h"

NAN_MODULE_INIT(InitModule) {  
  Mat::Init(target);

  VideoCapture::Init(target);

  target->Set(
    Nan::New("namedWindow").ToLocalChecked(),
    Nan::New<v8::FunctionTemplate>(NamedWindow)->GetFunction()
  );

  target->Set(
    Nan::New("imshow").ToLocalChecked(),
    Nan::New<v8::FunctionTemplate>(Imshow)->GetFunction()
  );

  target->Set(
    Nan::New("waitKey").ToLocalChecked(),
    Nan::New<v8::FunctionTemplate>(WaitKey)->GetFunction()
  );

   target->Set(
    Nan::New("imread").ToLocalChecked(),
    Nan::New<v8::FunctionTemplate>(Imread)->GetFunction()
  );

  target->Set(
    Nan::New("resize").ToLocalChecked(),
    Nan::New<v8::FunctionTemplate>(Resize)->GetFunction()
  );
}

NODE_MODULE(myModule, InitModule);