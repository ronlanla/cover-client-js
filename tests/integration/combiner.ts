// Copyright 2019 Diffblue Limited. All Rights Reserved.

import { readFileSync } from 'fs';
import { groupBy } from 'lodash';
import { generateTestClass, mergeIntoTestClass } from '../../src/combiner';
import assert from '../../src/utils/assertExtra';


const resultsJson = readFileSync('./tests/integration/dummy-results.json');
const { results: dummyResults } = JSON.parse(resultsJson.toString());
const resultsBySourceFilePath = groupBy(dummyResults, 'sourceFilePath');
const resultsBySourceFilePathAndTestedFunction: any = {};  // tslint:disable-line:no-any
for (const [key, resultGroup] of Object.entries(resultsBySourceFilePath)) {
  resultsBySourceFilePathAndTestedFunction[key] = groupBy(resultGroup, 'testedFunction');
}

const sampleSourceFilePath = '/com/diffblue/javademo/UserAccess.java';
const sampleSingleTestFunction = 'java::com.diffblue.javademo.UserAccess.getCurrentUser:()Ljava/lang/String;';
const sampleMultiTestFunction = 'java::com.diffblue.javademo.UserAccess.loginUser:(Ljava/lang/String;Ljava/lang/String;)Z'; // tslint:disable-line:max-line-length

// tslint:disable:max-line-length
const expectedSingleTestClass = (
`package com.diffblue.javademo;
import com.diffblue.javademo.UserAccess;
import org.junit.Assert;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.junit.rules.Timeout;




public class UserAccess {
  @Rule
  public final ExpectedException thrown = ExpectedException.none();
  @Rule
  public final Timeout globalTimeout = new Timeout(10000);
  /* testedClasses: UserAccessTest */
  /*
   * Test written by Diffblue Cover.
   * This test case covers the entire method.
   */

  @Test
  public void getCurrentUserOutputNull() {

    // Arrange
    final UserAccess objectUnderTest = new UserAccess();

    // Act
    final String retval = objectUnderTest.getCurrentUser();

    // Assert result
    Assert.assertNull(retval);

  }
}
`);

const expectedMultiTestClass = (
`package com.diffblue.javademo;
import static org.mockito.AdditionalMatchers.or;
import static org.mockito.Matchers.anyInt;
import static org.mockito.Matchers.isA;
import static org.mockito.Matchers.isNull;

import com.diffblue.deeptestutils.Reflector;
import com.diffblue.deeptestutils.mock.DTUMemberMatcher;
import com.diffblue.javademo.UserAccess;
import com.diffblue.javademo.serveraccess.DatabaseDao;
import com.mongodb.MongoClient;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;
import org.bson.conversions.Bson;
import org.junit.Assert;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.junit.rules.Timeout;
import org.junit.runner.RunWith;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.PowerMockRunner;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;





@RunWith(PowerMockRunner.class)
@RunWith(PowerMockRunner.class)
public class UserAccess {
  @Rule
  public final ExpectedException thrown = ExpectedException.none();
  @Rule
  public final Timeout globalTimeout = new Timeout(10000);
  /* testedClasses: UserAccessTest */
  /*
   * Test written by Diffblue Cover.
   * This test case covers:
   *  - conditional line 24 branch to line 25
   */

  @Test
  public void loginUserInputNotNullNullOutputFalse() {

    // Arrange
    final UserAccess objectUnderTest = new UserAccess();
    final String username = "";
    final String password = null;

    // Act
    final boolean retval = objectUnderTest.loginUser(username, password);

    // Assert result
    Assert.assertEquals(false, retval);

  }

  /*
   * Test written by Diffblue Cover.
   * This test case covers:
   *  - conditional line 24 branch to line 24
   *  - conditional line 24 branch to line 25
   */

  @Test
  public void loginUserInputNotNullNotNullOutputFalse() {

    // Arrange
    final UserAccess objectUnderTest = new UserAccess();
    final String username = "AAAAAAAA";
    final String password = "";

    // Act
    final boolean retval = objectUnderTest.loginUser(username, password);

    // Assert result
    Assert.assertEquals(false, retval);

  }

  /*
   * Test written by Diffblue Cover.
   * This test case covers:
   *  - conditional line 24 branch to line 24
   *  - conditional line 24 branch to line 28
   *  - conditional line 33 branch to line 34
   */
  @PrepareForTest({MongoDatabase.class, UserAccess.class, MongoCollection.class, Document.class, MongoClient.class, DatabaseDao.class})
  @Test
  public void loginUserInputNotNullNotNullOutputTrue() throws Exception, InvocationTargetException {

    // Arrange
    final UserAccess objectUnderTest = new UserAccess();
    final String username = "AAAAAAAA";
    final String password = " ";
    final MongoClient mongoClient = PowerMockito.mock(MongoClient.class);
    final MongoDatabase mongoDatabase = PowerMockito.mock(MongoDatabase.class);
    final MongoCollection mongoCollection = PowerMockito.mock(MongoCollection.class);
    final Method countMethod = DTUMemberMatcher.method(MongoCollection.class, "count", Bson.class);
    PowerMockito.doReturn(1L).when(mongoCollection, countMethod).withArguments(or(isA(Bson.class), isNull(Bson.class)));
    final Method getCollectionMethod = DTUMemberMatcher.method(MongoDatabase.class, "getCollection", String.class);
    PowerMockito.doReturn(mongoCollection).when(mongoDatabase, getCollectionMethod).withArguments(or(isA(String.class), isNull(String.class)));
    final Method getDatabaseMethod = DTUMemberMatcher.method(MongoClient.class, "getDatabase", String.class);
    PowerMockito.doReturn(mongoDatabase).when(mongoClient, getDatabaseMethod).withArguments(or(isA(String.class), isNull(String.class)));
    PowerMockito.whenNew(MongoClient.class).withParameterTypes(String.class, int.class).withArguments(or(isA(String.class), isNull(String.class)), anyInt()).thenReturn(mongoClient);
    final Document document = PowerMockito.mock(Document.class);
    final Document document1 = (Document) Reflector.getInstance("org.bson.Document");
    final Method appendMethod = DTUMemberMatcher.method(Document.class, "append", String.class, Object.class);
    PowerMockito.doReturn(document1).when(document, appendMethod).withArguments(or(isA(String.class), isNull(String.class)), or(isA(Object.class), isNull(Object.class)));
    PowerMockito.whenNew(Document.class).withParameterTypes(String.class, Object.class).withArguments(or(isA(String.class), isNull(String.class)), or(isA(Object.class), isNull(Object.class))).thenReturn(document);

    // Act
    final boolean retval = objectUnderTest.loginUser(username, password);

    // Assert side effects
    Assert.assertEquals("AAAAAAAA", objectUnderTest.getCurrentUser());

    // Assert result
    Assert.assertEquals(true, retval);

  }

  /*
   * Test written by Diffblue Cover.
   * This test case covers:
   *  - conditional line 24 branch to line 24
   *  - conditional line 24 branch to line 28
   *  - conditional line 33 branch to line 38
   */
  @PrepareForTest({MongoDatabase.class, UserAccess.class, MongoCollection.class, Document.class, MongoClient.class, DatabaseDao.class})
  @Test
  public void loginUserInputNotNullNotNullOutputFalse2() throws Exception, InvocationTargetException {

    // Arrange
    final UserAccess objectUnderTest = new UserAccess();
    final String username = "AAAAAAAA";
    final String password = " ";
    final MongoClient mongoClient = PowerMockito.mock(MongoClient.class);
    final MongoDatabase mongoDatabase = PowerMockito.mock(MongoDatabase.class);
    final MongoCollection mongoCollection = PowerMockito.mock(MongoCollection.class);
    final Method countMethod = DTUMemberMatcher.method(MongoCollection.class, "count", Bson.class);
    PowerMockito.doReturn(2_147_483_649L).when(mongoCollection, countMethod).withArguments(or(isA(Bson.class), isNull(Bson.class)));
    final Method getCollectionMethod = DTUMemberMatcher.method(MongoDatabase.class, "getCollection", String.class);
    PowerMockito.doReturn(mongoCollection).when(mongoDatabase, getCollectionMethod).withArguments(or(isA(String.class), isNull(String.class)));
    final Method getDatabaseMethod = DTUMemberMatcher.method(MongoClient.class, "getDatabase", String.class);
    PowerMockito.doReturn(mongoDatabase).when(mongoClient, getDatabaseMethod).withArguments(or(isA(String.class), isNull(String.class)));
    PowerMockito.whenNew(MongoClient.class).withParameterTypes(String.class, int.class).withArguments(or(isA(String.class), isNull(String.class)), anyInt()).thenReturn(mongoClient);
    final Document document = PowerMockito.mock(Document.class);
    final Document document1 = (Document) Reflector.getInstance("org.bson.Document");
    final Method appendMethod = DTUMemberMatcher.method(Document.class, "append", String.class, Object.class);
    PowerMockito.doReturn(document1).when(document, appendMethod).withArguments(or(isA(String.class), isNull(String.class)), or(isA(Object.class), isNull(Object.class)));
    PowerMockito.whenNew(Document.class).withParameterTypes(String.class, Object.class).withArguments(or(isA(String.class), isNull(String.class)), or(isA(Object.class), isNull(Object.class))).thenReturn(document);

    // Act
    final boolean retval = objectUnderTest.loginUser(username, password);

    // Assert result
    Assert.assertEquals(false, retval);

  }
}
`);

const expectedFirstTestClass = (
`package com.diffblue.javademo;
import com.diffblue.javademo.UserAccess;
import org.junit.Assert;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.junit.rules.Timeout;




public class UserAccess {
  @Rule
  public final ExpectedException thrown = ExpectedException.none();
  @Rule
  public final Timeout globalTimeout = new Timeout(10000);
  /* testedClasses: UserAccessTest */
  /*
   * Test written by Diffblue Cover.
   * This test case covers:
   *  - conditional line 24 branch to line 25
   */

  @Test
  public void loginUserInputNotNullNullOutputFalse() {

    // Arrange
    final UserAccess objectUnderTest = new UserAccess();
    final String username = "";
    final String password = null;

    // Act
    final boolean retval = objectUnderTest.loginUser(username, password);

    // Assert result
    Assert.assertEquals(false, retval);

  }
}
`);

const expectedMergedTestClass = (
`package com.diffblue.javademo;
import com.diffblue.javademo.UserAccess;
import org.junit.Assert;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.junit.rules.Timeout;

import static org.mockito.AdditionalMatchers.or;
import static org.mockito.Matchers.anyInt;
import static org.mockito.Matchers.isA;
import static org.mockito.Matchers.isNull;

import com.diffblue.deeptestutils.Reflector;
import com.diffblue.deeptestutils.mock.DTUMemberMatcher;
import com.diffblue.javademo.serveraccess.DatabaseDao;
import com.mongodb.MongoClient;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;
import org.bson.conversions.Bson;
import org.junit.runner.RunWith;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.PowerMockRunner;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;




@org.junit.runner.RunWith(org.powermock.modules.junit4.PowerMockRunner.class)
public class UserAccess {
  @Rule
  public final ExpectedException thrown = ExpectedException.none();
  @Rule
  public final Timeout globalTimeout = new Timeout(10000);
  /* testedClasses: UserAccessTest */

  /*
   * Test written by Diffblue Cover.
   * This test case covers:
   *  - conditional line 24 branch to line 24
   *  - conditional line 24 branch to line 25
   */

  @Test
  public void loginUserInputNotNullNotNullOutputFalse2() {

    // Arrange
    final UserAccess objectUnderTest = new UserAccess();
    final String username = "AAAAAAAA";
    final String password = "";

    // Act
    final boolean retval = objectUnderTest.loginUser(username, password);

    // Assert result
    Assert.assertEquals(false, retval);

  }

  /*
   * Test written by Diffblue Cover.
   * This test case covers:
   *  - conditional line 24 branch to line 24
   *  - conditional line 24 branch to line 28
   *  - conditional line 33 branch to line 38
   */
  @PrepareForTest({MongoDatabase.class, UserAccess.class, MongoCollection.class, Document.class, MongoClient.class, DatabaseDao.class})
  @Test
  public void loginUserInputNotNullNotNullOutputFalse() throws Exception, InvocationTargetException {

    // Arrange
    final UserAccess objectUnderTest = new UserAccess();
    final String username = "AAAAAAAA";
    final String password = " ";
    final MongoClient mongoClient = PowerMockito.mock(MongoClient.class);
    final MongoDatabase mongoDatabase = PowerMockito.mock(MongoDatabase.class);
    final MongoCollection mongoCollection = PowerMockito.mock(MongoCollection.class);
    final Method countMethod = DTUMemberMatcher.method(MongoCollection.class, "count", Bson.class);
    PowerMockito.doReturn(2_147_483_649L).when(mongoCollection, countMethod).withArguments(or(isA(Bson.class), isNull(Bson.class)));
    final Method getCollectionMethod = DTUMemberMatcher.method(MongoDatabase.class, "getCollection", String.class);
    PowerMockito.doReturn(mongoCollection).when(mongoDatabase, getCollectionMethod).withArguments(or(isA(String.class), isNull(String.class)));
    final Method getDatabaseMethod = DTUMemberMatcher.method(MongoClient.class, "getDatabase", String.class);
    PowerMockito.doReturn(mongoDatabase).when(mongoClient, getDatabaseMethod).withArguments(or(isA(String.class), isNull(String.class)));
    PowerMockito.whenNew(MongoClient.class).withParameterTypes(String.class, int.class).withArguments(or(isA(String.class), isNull(String.class)), anyInt()).thenReturn(mongoClient);
    final Document document = PowerMockito.mock(Document.class);
    final Document document1 = (Document) Reflector.getInstance("org.bson.Document");
    final Method appendMethod = DTUMemberMatcher.method(Document.class, "append", String.class, Object.class);
    PowerMockito.doReturn(document1).when(document, appendMethod).withArguments(or(isA(String.class), isNull(String.class)), or(isA(Object.class), isNull(Object.class)));
    PowerMockito.whenNew(Document.class).withParameterTypes(String.class, Object.class).withArguments(or(isA(String.class), isNull(String.class)), or(isA(Object.class), isNull(Object.class))).thenReturn(document);

    // Act
    final boolean retval = objectUnderTest.loginUser(username, password);

    // Assert result
    Assert.assertEquals(false, retval);

  }

  /*
   * Test written by Diffblue Cover.
   * This test case covers:
   *  - conditional line 24 branch to line 24
   *  - conditional line 24 branch to line 28
   *  - conditional line 33 branch to line 34
   */
  @PrepareForTest({MongoDatabase.class, UserAccess.class, MongoCollection.class, Document.class, MongoClient.class, DatabaseDao.class})
  @Test
  public void loginUserInputNotNullNotNullOutputTrue() throws Exception, InvocationTargetException {

    // Arrange
    final UserAccess objectUnderTest = new UserAccess();
    final String username = "AAAAAAAA";
    final String password = " ";
    final MongoClient mongoClient = PowerMockito.mock(MongoClient.class);
    final MongoDatabase mongoDatabase = PowerMockito.mock(MongoDatabase.class);
    final MongoCollection mongoCollection = PowerMockito.mock(MongoCollection.class);
    final Method countMethod = DTUMemberMatcher.method(MongoCollection.class, "count", Bson.class);
    PowerMockito.doReturn(1L).when(mongoCollection, countMethod).withArguments(or(isA(Bson.class), isNull(Bson.class)));
    final Method getCollectionMethod = DTUMemberMatcher.method(MongoDatabase.class, "getCollection", String.class);
    PowerMockito.doReturn(mongoCollection).when(mongoDatabase, getCollectionMethod).withArguments(or(isA(String.class), isNull(String.class)));
    final Method getDatabaseMethod = DTUMemberMatcher.method(MongoClient.class, "getDatabase", String.class);
    PowerMockito.doReturn(mongoDatabase).when(mongoClient, getDatabaseMethod).withArguments(or(isA(String.class), isNull(String.class)));
    PowerMockito.whenNew(MongoClient.class).withParameterTypes(String.class, int.class).withArguments(or(isA(String.class), isNull(String.class)), anyInt()).thenReturn(mongoClient);
    final Document document = PowerMockito.mock(Document.class);
    final Document document1 = (Document) Reflector.getInstance("org.bson.Document");
    final Method appendMethod = DTUMemberMatcher.method(Document.class, "append", String.class, Object.class);
    PowerMockito.doReturn(document1).when(document, appendMethod).withArguments(or(isA(String.class), isNull(String.class)), or(isA(Object.class), isNull(Object.class)));
    PowerMockito.whenNew(Document.class).withParameterTypes(String.class, Object.class).withArguments(or(isA(String.class), isNull(String.class)), or(isA(Object.class), isNull(Object.class))).thenReturn(document);

    // Act
    final boolean retval = objectUnderTest.loginUser(username, password);

    // Assert side effects
    Assert.assertEquals("AAAAAAAA", objectUnderTest.getCurrentUser());

    // Assert result
    Assert.assertEquals(true, retval);

  }
  /*
   * Test written by Diffblue Cover.
   * This test case covers:
   *  - conditional line 24 branch to line 25
   */

  @Test
  public void loginUserInputNotNullNullOutputFalse() {

    // Arrange
    final UserAccess objectUnderTest = new UserAccess();
    final String username = "";
    final String password = null;

    // Act
    final boolean retval = objectUnderTest.loginUser(username, password);

    // Assert result
    Assert.assertEquals(false, retval);

  }
}
`);
// tslint:enable:max-line-length

describe('src/combiner', () => {
  describe('generateTestClass', () => {
    it('Check fixtures', () => {
      assert.ok(sampleSourceFilePath in resultsBySourceFilePathAndTestedFunction);
      assert.ok(sampleSingleTestFunction in resultsBySourceFilePathAndTestedFunction[sampleSourceFilePath]);
      assert.ok(resultsBySourceFilePathAndTestedFunction[sampleSourceFilePath][sampleSingleTestFunction].length === 1);
      assert.ok(sampleMultiTestFunction in resultsBySourceFilePathAndTestedFunction[sampleSourceFilePath]);
      assert.ok(resultsBySourceFilePathAndTestedFunction[sampleSourceFilePath][sampleMultiTestFunction].length > 1);
    });
    it('Can generate a test class for a single test', () => {
      const results = resultsBySourceFilePathAndTestedFunction[sampleSourceFilePath][sampleSingleTestFunction];
      const testClass = generateTestClass(results);
      assert.strictEqual(testClass, expectedSingleTestClass);
    });
    it('Can generate a test class for multiple tests (including class annotations)', () => {
      const results = resultsBySourceFilePathAndTestedFunction[sampleSourceFilePath][sampleMultiTestFunction];
      const testClass = generateTestClass(results);
      assert.strictEqual(testClass, expectedMultiTestClass);
    });
  });
  describe('mergeIntoTestClass', () => {
    it('Can merge results into an existing test class', async () => {
      const [
        firstResult,
        ...results
      ] = resultsBySourceFilePathAndTestedFunction[sampleSourceFilePath][sampleMultiTestFunction];
      const testClass = generateTestClass([firstResult]);
      assert.strictEqual(testClass, expectedFirstTestClass);
      const mergedTestClass = await mergeIntoTestClass(testClass, results);
      assert.strictEqual(mergedTestClass, expectedMergedTestClass);
    });
  });
});
